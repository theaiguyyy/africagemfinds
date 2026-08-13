# Africa Gem Finds performance audit

Audit date: 2026-08-13. Tests used the production Next.js build on localhost with Lighthouse 12.8.2 mobile simulated throttling. Original image masters were preserved unchanged.

## Baseline

| Metric | Before | After |
|---|---:|---:|
| Lighthouse performance | 33 | 89 |
| Initial transfer | 197.96 MB | 2.33 MB |
| Image transfer | 197.50 MB | 1.86 MB |
| Image requests | 14 | 7 |
| LCP | audit timed out at 437.7 s | 2.77 s |
| FCP | 2.52 s | 0.94 s |
| Total Blocking Time | 3.63 s | 0.16 s |
| CLS | 0.00059 | 0.00059 |
| Long tasks | 20 | 5 |

The baseline LCP result was effectively a timeout caused by the initial image payload, so it was not a meaningful user-visible paint measurement. The after result is stable and just above the 2.5-second stretch target under simulated mobile throttling.

## Root causes

- All eight full-resolution hero slides were mounted on first render. Native lazy loading did not prevent the viewport-sized, absolutely positioned slides from being fetched.
- Ordinary page views downloaded multi-megabyte original JPEG masters instead of responsive display derivatives.
- Full-bleed CSS backgrounds bypassed responsive image selection and lazy loading.
- Carousel autoplay continued while the page was hidden, offscreen, or configured for reduced motion.
- GSAP/ScrollTrigger loaded during hydration and competed with the critical render.
- The navigation used a 268 KB source logo despite displaying it at 72 px high.

## Changes

- Moved content imagery to Next.js Image with WebP delivery, quality 95, responsive `srcset`/`sizes`, stable fill containers, and a 31-day optimizer cache.
- The first hero image is server-rendered and preloaded. Other slides are not mounted initially. The next slide is prepared after the first image loads/while idle, and each subsequent slide is mounted one second before its transition.
- The first automatic transition waits eight seconds so it cannot replace the initial LCP candidate during the critical paint window; subsequent transitions retain the five-second cadence.
- Autoplay pauses when the hero is offscreen, the document is hidden, or `prefers-reduced-motion` is enabled.
- Converted mission, story, authentication, and audience full-bleed backgrounds to responsive lazy images while retaining the approved crop and scrims.
- Full-resolution masters are requested only when the user deliberately activates a loupe interaction.
- Deferred noncritical GSAP initialization until window load/idle and removed the duplicate home navigation scroll animation.
- Added a losslessly resized navigation logo generated from the untouched source master.

## Image-quality validation

The representative homepage hero was compared at the same crop and display dimensions using the original JPEG and the 1920 px, quality-95 WebP derivative. Fine crystal edges, inclusions, colour, contrast, and transparency were visually equivalent at 100% and remained acceptable under close inspection. Comparison artifact: `.performance/hero-quality-comparison.png` (not shipped to users).

No original in `public/images` was overwritten, deleted, recompressed, or resized. The original URL remains available to the loupe interaction. The navigation derivative can be regenerated with:

```bash
npm run images:generate
```

New gemstone images need no manual derivative command: add the untouched master to storage/public assets and use the Next.js Image component with an accurate `sizes` value and `quality={95}`. Vercel/Next creates and caches responsive derivatives on demand.

## Verification

- `npm run build`: pass, including TypeScript and static generation for all 17 routes.
- Mobile homepage production Lighthouse: 89, 2.33 MB initial transfer, 2.77 s LCP, 158 ms TBT.
- Desktop Lighthouse transferred the same 2.33 MB and retained 183 ms TBT/near-zero CLS. Its simulated LCP was 7.40 s (score 62); this is the main remaining optimization target and is documented rather than traded for lower gemstone fidelity.
- Initial homepage network requests only the active hero plus images that enter the audited scroll viewport; inactive carousel originals are absent.
- Representative quality comparison: pass.
- The repository has no configured lint or test command. Type checking is part of `next build` and passed.
- Remaining practical limitation: the homepage is still a large client component. Splitting its static sections into server components is the next main-thread optimization, but it was intentionally not included because it would be a broader structural change with higher visual-regression risk.

## Rollback

Revert the performance commit. Original image masters remain present, so rollback does not require restoring media files. The generated `public/africa-gem-finds-logo-nav.png` may be removed after reverting its Nav reference.
