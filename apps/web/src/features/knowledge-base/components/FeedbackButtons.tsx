import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2, CheckCircle } from "lucide-react";
import { useSubmitFeedback } from "../hooks/useKnowledgeBase.js";

interface FeedbackButtonsProps {
  articleId: string;
}

export function FeedbackButtons({ articleId }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const { mutate: submitFeedback, isPending } = useSubmitFeedback();

  const handleFeedback = (helpful: boolean) => {
    if (submitted !== null || isPending) return;
    submitFeedback(
      { id: articleId, data: { helpful } },
      {
        onSuccess: () => setSubmitted(helpful),
      }
    );
  };

  if (submitted !== null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <CheckCircle className="h-4 w-4 text-emerald-400" />
        <p className="text-sm font-medium text-emerald-400">
          {submitted ? "Great! Glad this was helpful." : "Thanks for your feedback — we'll improve this article."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
      <p className="mb-3 text-sm font-semibold text-foreground">Was this article helpful?</p>
      <div className="flex gap-3">
        <button
          id={`kb-feedback-helpful-${articleId}`}
          disabled={isPending}
          onClick={() => handleFeedback(true)}
          className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10
            px-4 py-2 text-sm font-semibold text-emerald-400 transition-all
            hover:bg-emerald-500/20 hover:border-emerald-500/60
            disabled:cursor-not-allowed disabled:opacity-60
            focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsUp className="h-4 w-4" />
          )}
          Yes, helpful
        </button>

        <button
          id={`kb-feedback-not-helpful-${articleId}`}
          disabled={isPending}
          onClick={() => handleFeedback(false)}
          className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10
            px-4 py-2 text-sm font-semibold text-rose-400 transition-all
            hover:bg-rose-500/20 hover:border-rose-500/60
            disabled:cursor-not-allowed disabled:opacity-60
            focus:outline-none focus:ring-2 focus:ring-rose-500/30"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsDown className="h-4 w-4" />
          )}
          Not really
        </button>
      </div>
    </div>
  );
}
