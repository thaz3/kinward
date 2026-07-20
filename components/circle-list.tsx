import Link from "next/link";
import type { AuthorizedCircle } from "@/lib/circles";

export function CircleList({ circles }: { circles: AuthorizedCircle[] }) {
  return (
    <ul className="circle-list" aria-label="Your active Family Circles">
      {circles.map((circle) => (
        <li key={circle.id} className="content-card">
          <h2>{circle.displayName}</h2>
          <p>
            {circle.isCircleHead
              ? "Circle Head · Active member"
              : "Active member"}
          </p>
          <Link className="button secondary" href={`/circles/${circle.id}`}>
            Open Circle
            <span className="visually-hidden"> {circle.displayName}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
