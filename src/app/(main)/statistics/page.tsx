"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useOutfits } from "@/hooks/useOutfits";
import { CLOTHING_CATEGORIES } from "@/constants/categories";
import { getColorLabel } from "@/constants/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Shirt, Star, Wallet, AlertCircle, TrendingUp } from "lucide-react";

const CHART_COLORS = ["#000000", "#808080", "#000080", "#8b4513", "#008000", "#800020", "#ff0000", "#ffa500", "#800080"];

export default function StatisticsPage() {
  const { items, loading: itemsLoading } = useWardrobe();
  const { outfits, loading: outfitsLoading } = useOutfits();
  const loading = itemsLoading || outfitsLoading;

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    });
    return CLOTHING_CATEGORIES.map((cat) => ({
      name: cat.label,
      count: counts[cat.value] ?? 0,
    })).filter((d) => d.count > 0);
  }, [items]);

  const colorData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.color] = (counts[item.color] ?? 0) + 1;
    });
    return Object.entries(counts).map(([color, count]) => ({
      name: getColorLabel(color),
      value: count,
    }));
  }, [items]);

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + (item.purchasePrice ?? 0), 0),
    [items]
  );

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const unusedItems = items.filter(
    (item) => !item.lastWornDate || item.lastWornDate < sixMonthsAgo
  );

  const mostWorn = useMemo(
    () => [...items].sort((a, b) => b.wearCount - a.wearCount).slice(0, 5),
    [items]
  );
  const leastWorn = useMemo(
    () => [...items].sort((a, b) => a.wearCount - b.wearCount).slice(0, 5),
    [items]
  );

  const ratedOutfits = outfits.filter((o) => o.rating);
  const averageRating =
    ratedOutfits.length > 0
      ? ratedOutfits.reduce((sum, o) => sum + (o.rating ?? 0), 0) / ratedOutfits.length
      : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Statistics" description="Loading insights..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Insights about your wardrobe and outfit habits."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Shirt className="h-5 w-5" />} label="Total items" value={items.length} />
        <StatCard icon={<Star className="h-5 w-5" />} label="Outfits" value={outfits.length} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Wardrobe value" value={`₪${totalValue.toLocaleString()}`} />
        <StatCard icon={<AlertCircle className="h-5 w-5" />} label="Unused (6mo+)" value={unusedItems.length} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No data yet"
          description="Add items to your wardrobe to unlock insights about colors, categories, and wear patterns."
          action={{ label: "Add first item", href: "/wardrobe/scan" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold">Items by category</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="currentColor" className="fill-primary" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold">Color distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={colorData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {colorData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold">Most worn</h2>
              <ul className="space-y-1">
                {mostWorn.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="truncate mr-4">{item.name}</span>
                    <span className="text-muted-foreground shrink-0">{item.wearCount} wears</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold">Least worn</h2>
              <ul className="space-y-1">
                {leastWorn.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="truncate mr-4">{item.name}</span>
                    <span className="text-muted-foreground shrink-0">{item.wearCount} wears</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {ratedOutfits.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h2 className="font-semibold">Outfit ratings</h2>
                <p className="text-sm text-muted-foreground">
                  Average rating: {averageRating.toFixed(1)} / 5
                </p>
                <ul className="space-y-1">
                  {ratedOutfits.slice(0, 5).map((outfit) => (
                    <li key={outfit.id} className="flex justify-between text-sm">
                      <span className="truncate mr-4">{outfit.name}</span>
                      <span className="text-muted-foreground shrink-0">{outfit.rating}/5</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
