"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  initialQuery?: string;
}

export function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/home?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search alumni... e.g. "PM in fintech who did BUILD"'
          className="h-12 rounded-none border-x-0 border-t-0 border-b border-white/30 bg-transparent pl-8 text-base tracking-wide"
        />
        <Button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2" size="sm" variant="ghost">
          Search
        </Button>
      </div>
    </form>
  );
}
