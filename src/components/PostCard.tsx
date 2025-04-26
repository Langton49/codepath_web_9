import { Link } from "react-router-dom";
import { Post } from "@/types";
import { ArrowUp, MessageCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  commentCount?: number;
}

export function PostCard({ post, commentCount = 0 }: PostCardProps) {
  const { user, upvotePost } = useAppContext();

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    upvotePost(post.id);
  };

  const isCurrentUserAuthor = post.user_id === user.id;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <Link to={`/post/${post.id}`} className="group">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold group-hover:text-artemis-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}{" "}
                • by {post.user_name || "Anonymous"}
                {isCurrentUserAuthor && (
                  <span className="ml-1 text-xs">(You)</span>
                )}
              </p>
            </div>

            {post.flag && (
              <Badge
                variant="outline"
                className={cn(
                  "ml-2",
                  post.flag === "Question" &&
                    "bg-blue-100 text-blue-800 border-blue-200",
                  post.flag === "Opinion" &&
                    "bg-purple-100 text-purple-800 border-purple-200",
                  post.flag === "Tip" &&
                    "bg-green-100 text-green-800 border-green-200",
                  post.flag === "News" &&
                    "bg-amber-100 text-amber-800 border-amber-200",
                  post.flag === "Project" &&
                    "bg-teal-100 text-teal-800 border-teal-200",
                  post.flag === "Discussion" &&
                    "bg-indigo-100 text-indigo-800 border-indigo-200"
                )}
              >
                {post.flag}
              </Badge>
            )}
          </div>
        </Link>
      </CardHeader>

      <CardContent className="pb-2">
        {user?.preferences?.showImagesInFeed && post.image_url && (
          <Link to={`/post/${post.id}`}>
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-48 object-cover rounded-md mb-3"
            />
          </Link>
        )}

        {user?.preferences?.showContentInFeed && (
          <Link to={`/post/${post.id}`}>
            <p className="line-clamp-3 text-muted-foreground">{post.content}</p>
          </Link>
        )}

        {post.repost_of && (
          <div className="mt-3 rounded border p-2 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              This is a repost.{" "}
              <Link
                to={`/post/${post.repost_of}`}
                className="text-artemis-primary hover:underline"
              >
                View original post →
              </Link>
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={handleUpvote}
          >
            <ArrowUp className="h-4 w-4 mr-1" />
            <span>{post.upvotes}</span>
          </Button>

          <Link
            to={`/post/${post.id}`}
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            <span>{commentCount}</span>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
