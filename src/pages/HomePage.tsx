import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { PostCard } from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Post, PostFlag } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const flagOptions: PostFlag[] = [
  "Question",
  "Opinion",
  "Tip",
  "News",
  "Project",
  "Discussion",
];

export default function HomePage() {
  const {
    posts,
    comments,
    isLoading,
    searchPosts,
    sortedPosts,
    filterPostsByFlag,
    user,
    setUserPreferences,
  } = useAppContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "upvotes">("time");
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<PostFlag | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Handle search and filtering
  useEffect(() => {
    const applyFilters = async () => {
      setLocalLoading(true);
      let result = [...posts];

      try {
        if (searchQuery.length > 0) {
          result = await searchPosts(searchQuery);
        }

        if (selectedFlag) {
          result = result.filter((post) => post.flag === selectedFlag);
        }

        result = result.sort((a, b) => {
          if (sortBy === "time") {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          } else if (sortBy === "upvotes") {
            return (b.upvotes || 0) - (a.upvotes || 0);
          }
          return 0;
        });

        setFilteredPosts(result);
      } catch (error) {
        console.error("Error applying filters:", error);
      } finally {
        setLocalLoading(false);
      }
    };

    applyFilters();
  }, [
    posts,
    searchQuery,
    sortBy,
    selectedFlag,
    searchPosts,
    filterPostsByFlag,
    sortedPosts,
  ]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    try {
      const results = await searchPosts(searchQuery);
      setFilteredPosts(results);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const getCommentCountForPost = (postId: string) => {
    return comments.filter((c) => c.post_id === postId).length;
  };

  const resetFilters = async () => {
    setSearchQuery("");
    setSelectedFlag(null);
    setSortBy("time");

    // Reset to default sorting when clearing filters
    setLocalLoading(true);
    try {
      const defaultSorted = await sortedPosts("time");
      setFilteredPosts(defaultSorted);
    } catch (error) {
      console.error("Error resetting filters:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePreferenceChange = async (
    preferences: Partial<typeof user.preferences>
  ) => {
    try {
      await setUserPreferences(preferences);
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Welcome to Artemis</h1>
          <p className="text-muted-foreground">
            Join our community of environmentalists sharing ideas to protect our
            planet
          </p>
        </div>

        <div className="flex justify-between items-center mb-6 gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Display Preferences</SheetTitle>
                  <SheetDescription>
                    Customize how posts appear in your feed
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-medium">Content Display</h3>
                    <div className="space-y-3">
                      <h3 className="font-medium">Sort Posts By</h3>
                      <Select
                        value={sortBy}
                        onValueChange={(value) =>
                          setSortBy(value as "time" | "upvotes")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sorting" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">Newest First</SelectItem>
                          <SelectItem value="upvotes">Most Upvoted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-content">Show content preview</Label>
                      <Switch
                        id="show-content"
                        checked={user?.preferences?.showContentInFeed}
                        onCheckedChange={(checked) =>
                          handlePreferenceChange({ showContentInFeed: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <SheetFooter>
                  <Button variant="outline" onClick={resetFilters}>
                    Reset All Filters
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {isLoading || localLoading ? (
          <LoadingSpinner />
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground mb-2">No posts found</p>
            <Button variant="outline" onClick={resetFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                commentCount={getCommentCountForPost(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
