import { Lock } from "lucide-react";

import type { UniversityLesson } from "@/data/university";

export function UniversityLessonMedia({
  lesson,
  unlocked,
}: {
  lesson: UniversityLesson;
  unlocked: boolean;
}) {
  const hasMedia = Boolean(lesson.videoUrl || lesson.embedUrl);
  if (!hasMedia) {
    return null;
  }

  if (!unlocked) {
    return (
      <div className="university-video is-locked" aria-hidden>
        {lesson.thumbnailUrl ? (
          // Next/Image needs a fixed remote allowlist; GHL thumbs come from many CDNs.
          <img src={lesson.thumbnailUrl} alt="" />
        ) : (
          <div className="university-video-placeholder" />
        )}
        <span>
          <Lock size={16} />
          Verify to play
        </span>
      </div>
    );
  }

  return (
    <div className="university-video">
      {lesson.embedUrl ? (
        <iframe
          src={lesson.embedUrl}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video
          src={lesson.videoUrl}
          controls
          playsInline
          preload="metadata"
          poster={lesson.thumbnailUrl || undefined}
        />
      )}
    </div>
  );
}
