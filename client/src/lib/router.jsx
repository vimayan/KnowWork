'use client';
/**
 * React Router → Next.js compatibility shim.
 * Drop-in replacement: change import source from 'react-router-dom' to '@/lib/router'
 * and everything else (API, JSX) stays the same.
 */
import NextLink from 'next/link';
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation';

// ── Link ──────────────────────────────────────────────────────────────────────
// Accepts `to` or `href` so existing JSX doesn't need prop renames.
export function Link({ to, href, children, className, onClick, ...rest }) {
  return (
    <NextLink href={to ?? href ?? '/'} className={className} onClick={onClick} {...rest}>
      {children}
    </NextLink>
  );
}

// ── NavLink ───────────────────────────────────────────────────────────────────
// Mirrors react-router-dom's NavLink: className can be a function ({ isActive }).
export function NavLink({ to, href, children, className, onClick, ...rest }) {
  const pathname = usePathname();
  const target = to ?? href ?? '/';
  const isActive = pathname === target || (target !== '/' && pathname.startsWith(target));
  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <NextLink href={target} className={resolvedClass} onClick={onClick} {...rest}>
      {children}
    </NextLink>
  );
}

// ── useNavigate ───────────────────────────────────────────────────────────────
// Returns a navigate(path) function identical to react-router-dom's.
export function useNavigate() {
  const router = useRouter();
  return (path) => router.push(path);
}

// ── useSearchParams ───────────────────────────────────────────────────────────
// Returns [searchParams, setSearchParams] tuple.
// setSearchParams is a no-op — pages that need it should use useRouter().push() directly.
export function useSearchParams() {
  const params = useNextSearchParams();
  return [params, () => {}];
}

// ── useParams ─────────────────────────────────────────────────────────────────
export function useParams() {
  return useNextParams();
}

// ── useLocation ───────────────────────────────────────────────────────────────
export function useLocation() {
  const pathname = usePathname();
  return { pathname };
}
