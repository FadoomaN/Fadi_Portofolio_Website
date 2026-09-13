import Link from 'next/link';
import CircuitDivider from '../circuit-divider';

type ReactionBarProps = {
  likeCount?: number;
  dislikeCount?: number;
};

export function ReactionBar({ likeCount = 24, dislikeCount = 2 }: ReactionBarProps) {
  return (
    <div className="journey-reaction-bar" aria-label="Post reactions">
      <button type="button" aria-label={`Like post. ${likeCount} likes`}>LIKE <span>{likeCount}</span></button>
      <button type="button" aria-label={`Dislike post. ${dislikeCount} dislikes`}>DISLIKE <span>{dislikeCount}</span></button>
    </div>
  );
}

type Comment = {
  author: string;
  time: string;
  body: string;
};

const temporaryComments: Comment[] = [
  { author: 'USER 001', time: '2 HOURS AGO', body: 'Really liked this version of the broth.' },
  { author: 'USER 002', time: 'YESTERDAY', body: 'Have you tried making the noodles thinner?' },
];

export function Comments() {
  return (
    <section className="journey-comments" aria-labelledby="comments-title">
      <div className="journey-content-label">
        <span>COMMENTS / 02</span>
        <h2 id="comments-title">COMMENTS</h2>
      </div>
      <form className="journey-comment-form">
        <label htmlFor="comment">ADD A COMMENT</label>
        <div>
          <input id="comment" name="comment" type="text" placeholder="Write something..." />
          <button type="submit">POST ↗</button>
        </div>
      </form>
      <div className="journey-comment-list">
        {temporaryComments.map((comment) => (
          <article className="journey-comment" key={comment.author}>
            <header>
              <strong>{comment.author}</strong>
              <time>{comment.time}</time>
            </header>
            <p>{comment.body}</p>
            <button type="button">REPLY</button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RamenContent() {
  return (
    <>
      <header className="journey-subthread-intro">
        <nav className="journey-breadcrumb" aria-label="Journey path">
          <Link href="/journey">JOURNEY</Link>
          <span aria-hidden="true">/</span>
          <Link href="/journey">THREADS</Link>
          <span aria-hidden="true">/</span>
          <Link href="/journey/cooking">COOKING</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">RAMEN</span>
        </nav>
        <h1 id="subthread-title">RAMEN</h1>
        <p>Different ramen attempts, broths, noodles and improvements.</p>
      </header>
      <CircuitDivider />
      <div className="journey-subthread-content">
        <div className="journey-post-media" role="img" aria-label="Temporary ramen video placeholder">
          <span>VIDEO / MEDIA PENDING</span>
          <i aria-hidden="true" />
        </div>
        <article className="journey-post">
          <p className="journey-content-label">LOG 001</p>
          <h2>FIRST RAMEN ATTEMPT</h2>
          <p className="journey-post-description">
            A first pass at building a richer broth, balancing the seasoning, and learning how the noodles change the whole bowl.
          </p>
          <ReactionBar />
        </article>
        <Comments />
      </div>
    </>
  );
}
