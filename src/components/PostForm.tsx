import { useState } from "react";
import { Post, PostFlag } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface PostFormProps {
  defaultValues?: {
    title: string;
    content: string;
    imageUrl?: string;
    flag?: PostFlag;
    repostOf?: string;
  };
  onSubmit: (
    title: string,
    content: string,
    imageUrl?: string,
    flag?: PostFlag,
    repostOf?: string
  ) => Promise<Post | boolean>;
  submitLabel: string;
  isEdit?: boolean;
  repostOf?: string;
}

export function PostForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isEdit = false,
  repostOf,
}: PostFormProps) {
  const [title, setTitle] = useState(defaultValues?.title || "");
  const [content, setContent] = useState(defaultValues?.content || "");
  const [imageUrl, setImageUrl] = useState(defaultValues?.imageUrl || "");
  const [flag, setFlag] = useState<PostFlag | undefined>(defaultValues?.flag);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!title.trim()) {
      setValidationError("Title is required");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const result = await onSubmit(title, content, imageUrl, flag, repostOf);

      if (typeof result !== "boolean" && "id" in result) {
        // If it's a post object with ID, it was successful
        navigate(`/post/${result.id}`);
      } else if (result === true) {
        // If it's boolean true from an update operation
        navigate(-1);
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      setValidationError("An error occurred while submitting your post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit Post" : repostOf ? "Repost" : "Create New Post"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {validationError && (
            <div className="bg-red-50 text-red-600 p-2 rounded-md text-sm">
              {validationError}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions or ideas..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="flag" className="text-sm font-medium">
              Post Type (optional)
            </label>
            <Select
              value={flag}
              onValueChange={(value) => setFlag(value as PostFlag)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Question">Question</SelectItem>
                <SelectItem value="Opinion">Opinion</SelectItem>
                <SelectItem value="Tip">Tip</SelectItem>
                <SelectItem value="News">News</SelectItem>
                <SelectItem value="Project">Project</SelectItem>
                <SelectItem value="Discussion">Discussion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
