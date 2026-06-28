"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTrips } from "@/hooks/useTrips";
import { format, addDays } from "date-fns";
import type { TripInput } from "@/types/trip";

export function TripForm() {
  const router = useRouter();
  const { create } = useTrips();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TripInput>({
    destination: "",
    startDate: new Date(),
    endDate: addDays(new Date(), 3),
    purpose: "vacation",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.destination.trim()) return;
    setLoading(true);
    try {
      const trip = await create(data);
      router.push(`/packing/${trip.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="destination">Destination</Label>
        <Input
          id="destination"
          value={data.destination}
          onChange={(e) => setData({ ...data, destination: e.target.value })}
          placeholder="e.g. Tel Aviv"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="date"
            value={format(data.startDate, "yyyy-MM-dd")}
            onChange={(e) =>
              setData({ ...data, startDate: new Date(e.target.value) })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            type="date"
            value={format(data.endDate, "yyyy-MM-dd")}
            onChange={(e) =>
              setData({ ...data, endDate: new Date(e.target.value) })
            }
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose</Label>
        <Select
          value={data.purpose}
          onValueChange={(value) => setData({ ...data, purpose: value ?? "vacation" })}
        >
          <SelectTrigger id="purpose">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vacation">Vacation</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="family">Family</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create trip"}
      </Button>
    </form>
  );
}
