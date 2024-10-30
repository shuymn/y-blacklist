const FILTER_PATTERNS: RegExp[] = [];

export default defineContentScript({
  matches: ["*://*.youtube.com/watch?v=*", "*://youtube.com/watch?v=*"],
  async main() {
    const isEnabled = await storage.getItem<boolean>(Keys.isEnabled, { fallback: true });
    if (!isEnabled) {
      return;
    }

    const filters = await storage.getItem<Filter[]>(Keys.filters, { fallback: [] });
    if (filters.length === 0) {
      return;
    }

    for (const filter of filters) {
      FILTER_PATTERNS.push(new RegExp(filter.pattern));
    }

    const loadHandler = async () => {
      const commentsSection = await waitForCommentsSection();

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const hasCommentChanges = Array.from(mutation.addedNodes).some((node) => {
            return (
              node instanceof HTMLElement &&
              (node.tagName.toLowerCase() === "ytd-comment-thread-renderer" ||
                node.querySelector("ytd-comment-thread-renderer"))
            );
          });

          if (hasCommentChanges) {
            hideComments(commentsSection);
          }
        }
      });

      observer.observe(commentsSection, {
        childList: true,
        subtree: true,
      });

      hideComments(commentsSection);

      window.removeEventListener("load", loadHandler);
    };

    window.addEventListener("load", loadHandler);
  },
});

function waitForCommentsSection(maxAttempts = 30) {
  let attempts = 0;

  return new Promise<HTMLElement>((resolve, reject) => {
    const checkComments = () => {
      const commentSection = document.querySelector<HTMLElement>("ytd-comments#comments");
      attempts++;

      if (commentSection) {
        resolve(commentSection);
      } else if (attempts >= maxAttempts) {
        reject(new Error("Comments section not found after maximum attempts"));
      } else {
        setTimeout(checkComments, 1000);
      }
    };

    checkComments();
  });
}

function hideComments(element: HTMLElement) {
  const comments = element.querySelectorAll<HTMLElement>("ytd-comment-thread-renderer");
  for (const comment of comments) {
    const contentText = comment.querySelector("#content-text");
    if (!contentText) {
      continue;
    }

    const content = contentText.textContent ?? "";
    const shouldHide = FILTER_PATTERNS.some((pattern) => pattern.test(content));
    if (shouldHide && comment.style.display !== "none") {
      comment.style.display = "none";
      continue;
    }

    const replySection = comment.querySelector<HTMLElement>("#replies");
    if (!replySection) {
      continue;
    }

    const replyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          const hasReplyChanges =
            node instanceof HTMLElement &&
            (node.tagName.toLowerCase() === "ytd-comment-view-model" || node.querySelector("ytd-comment-view-model"));

          if (hasReplyChanges) {
            hideReplies(replySection);
          }
        }
      }
    });

    const replyButton = replySection.querySelector<HTMLElement>("ytd-button-renderer#more-replies");
    if (replyButton && !replyButton.dataset.processed) {
      replyButton.dataset.processed = "true";

      const clickHandler = () => {
        replyObserver.observe(comment, {
          childList: true,
          subtree: true,
        });
        replyButton.removeEventListener("click", clickHandler);
      };

      replyButton.addEventListener("click", clickHandler);
    }
  }
}

function hideReplies(element: HTMLElement) {
  const replies = element.querySelectorAll<HTMLElement>("ytd-comment-view-model");
  for (const reply of replies) {
    const content = reply.querySelector("#content-text")?.textContent ?? "";
    const shouldHide = FILTER_PATTERNS.some((pattern) => pattern.test(content));
    if (shouldHide && reply.style.display !== "none") {
      reply.style.display = "none";
    }
  }
}
