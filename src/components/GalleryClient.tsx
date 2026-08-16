"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryImage, GalleryStone } from "@/lib/gallery/types";
import { gallerySizes, storageVariant } from "@/lib/gallery/images";
import { educationalFact, inquiryMessage, statusContent } from "@/lib/gallery/content";
import { getRelatedAvailableStones } from "@/lib/gallery/recommendations";
import styles from "./GalleryClient.module.css";

export default function GalleryClient({ stones }: { stones: GalleryStone[] }) {
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("All");
  const [origin, setOrigin] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<GalleryStone | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [inquire, setInquire] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const families = ["All", ...new Set(stones.map((s) => s.family))];
  const origins = ["All", ...new Set(stones.map((s) => s.origin))];
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stoneRef = params.get("stone");
    const initialSearch = params.get("search");
    if (initialSearch) setSearch(initialSearch);
    if (stoneRef) {
      const match = stones.find((stone) => [stone.id, stone.sku, stone.slug].includes(stoneRef));
      if (match) { setSelected(match); setImageIndex(0); }
    }
  }, [stones]);
  const visible = useMemo(
    () =>
      stones.filter(
        (s) =>
          (family === "All" || s.family === family) &&
          (origin === "All" || s.origin === origin) &&
          (status === "All" || s.status === status.toLowerCase()) &&
          `${s.title} ${s.family} ${s.origin} ${s.sku}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [stones, search, family, origin, status],
  );
  const related = useMemo(
    () => selected ? getRelatedAvailableStones(stones, selected) : [],
    [stones, selected],
  );
  const open = (stone: GalleryStone, target: HTMLElement) => {
    openerRef.current = target;
    setSelected(stone);
    setImageIndex(0);
    window.history.replaceState(null, "", `/gallery/${stone.slug}`);
  };
  const close = () => {
    setSelected(null);
    setInquire(false);
    window.history.replaceState(null, "", "/gallery");
    requestAnimationFrame(() => openerRef.current?.focus());
  };
  const openRelated = (stone: GalleryStone) => {
    setSelected(stone);
    setImageIndex(0);
    setInquire(false);
    window.history.replaceState(null, "", `/gallery/${stone.slug}`);
    requestAnimationFrame(() => {
      modalRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      closeRef.current?.focus();
    });
  };
  useEffect(() => {
    if (!selected) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight")
        setImageIndex((i) => Math.min(i + 1, selected.images.length - 1));
      if (event.key === "ArrowLeft") setImageIndex((i) => Math.max(i - 1, 0));
      if (event.key === "Tab") {
        const nodes = document.querySelectorAll<HTMLElement>(
          "[data-gallery-dialog] a,[data-gallery-dialog] button,[data-gallery-dialog] input,[data-gallery-dialog] textarea",
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", key);
    };
  }, [selected]);
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <picture>
          <source
            media="(max-width: 800px)"
            srcSet="/gallery-variants/gallery-hero-800.webp"
          />
          <img
            src="/gallery-variants/gallery-hero-1600.webp"
            alt="African rough gemstones"
            width="1600"
            height="1067"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <span>Gallery · African rough gemstones</span>
          <h1>
            Material worth
            <br />
            <em>looking closer at.</em>
          </h1>
          <p>
            Browse current and past parcels, then inquire directly about the
            stone that interests you.
          </p>
        </div>
      </header>
      <section className={styles.intro}>
        <div>
          <span>Selected rough · direct inquiry</span>
          <h2>The gemstone gallery</h2>
        </div>
        <p>
          See something you like? Send us a direct inquiry about that stone, or
          ask us to help you find something similar.
          <small>
            Stone colour can vary with lighting and screen calibration.
          </small>
        </p>
      </section>
      <section className={styles.tools} aria-label="Gallery filters">
        <input
          aria-label="Search gallery"
          placeholder="Search stones"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label><span>Gemstone</span><select aria-label="Gemstone family" value={family} onChange={(e) => setFamily(e.target.value)}>{families.map((x) => <option key={x} value={x}>{x === "All" ? "All gemstones" : x}</option>)}</select></label>
        <label><span>Origin</span><select aria-label="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)}>{origins.map((x) => <option key={x} value={x}>{x === "All" ? "All origins" : x}</option>)}</select></label>
        <label><span>Availability</span><select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="All">All statuses</option><option>Available</option><option>Sold</option></select></label>
        <span>{visible.length} stones</span>
      </section>
      <section className={styles.grid} aria-live="polite">
        {visible.map((stone) => {
          const primary =
            stone.images.find((i) => i.isPrimary) ?? stone.images[0];
          return (
            <Link
              key={stone.id}
              href={`/gallery/${stone.slug}`}
              prefetch={false}
              className={styles.card}
              onClick={(e) => { e.preventDefault(); open(stone, e.currentTarget); }}
            >
              <DeferredCardImage image={primary} />
              <i className={stone.status === "sold" ? styles.sold : ""}>
                {stone.status}
              </i>
              <span className={styles.scrim} />
              <span className={styles.cardCopy}>
                <small>
                  {stone.family} · {stone.sku}
                </small>
                <strong>{stone.title}</strong>
                <span>
                  {stone.publicWeight} · {stone.origin}
                </span>
              </span>
            </Link>
          );
        })}
      </section>
      {selected && (
        <div
          className={styles.backdrop}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <section
            ref={modalRef}
            data-gallery-dialog
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stone-title"
          >
            <button
              ref={closeRef}
              className={styles.close}
              onClick={close}
              aria-label="Close details"
            >
              ×
            </button>
            <div className={styles.viewer}>
              <div className={styles.mainImage}>
                <Image
                  src={storageVariant(selected.images[imageIndex].url, 1200)}
                  alt={selected.images[imageIndex].alt}
                  fill
                  sizes={gallerySizes.detail}
                  quality={95}
                />
                <span>
                  View {imageIndex + 1} of {selected.images.length}
                </span>
              </div>
              {selected.images.length > 1 && (
                <div className={styles.thumbs}>
                  {selected.images.map((image, i) => (
                    <button
                      key={image.id}
                      className={i === imageIndex ? styles.activeThumb : ""}
                      onClick={() => setImageIndex(i)}
                      aria-label={`Show view ${i + 1}`}
                    >
                      <Image
                        src={storageVariant(image.url, 320)}
                        alt=""
                        fill
                        sizes="160px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.details}>
              <span>
                {selected.family} · {selected.sku}
              </span>
              <h2 id="stone-title">{selected.title}</h2>
              <dl>
                <div>
                  <dt>Origin</dt>
                  <dd>{selected.origin}</dd>
                </div>
                <div>
                  <dt>Weight</dt>
                  <dd>{selected.publicWeight}</dd>
                </div>
                <div><dt>Material</dt><dd>{selected.family}</dd></div>
                <div>
                  <dt>Status</dt>
                  <dd className={selected.status === "sold" ? styles.statusSold : styles.statusAvailable}>{selected.status}</dd>
                </div>
              </dl>
              {selected.description && <p>{selected.description}</p>}
              <aside><strong>Gemstone note</strong><p>{educationalFact(selected)}</p></aside>
              <p className={styles.supporting}>{statusContent(selected.status).supporting}</p>
              <button className={styles.cta} onClick={() => setInquire(true)}>
                {statusContent(selected.status).cta}
              </button>
              {inquire && <InquiryForm stone={selected} />}
            </div>
            {related.length > 0 && (
              <section className={styles.related} aria-labelledby="related-stones-title">
                <div className={styles.relatedHead}>
                  <span>Continue exploring</span>
                  <h3 id="related-stones-title">More stones from the gallery</h3>
                </div>
                <div className={styles.relatedGrid}>
                  {related.map((stone) => {
                    const primary = stone.images.find((image) => image.isPrimary) ?? stone.images[0];
                    return (
                      <Link
                        key={stone.id}
                        href={`/gallery/${stone.slug}`}
                        prefetch={false}
                        className={styles.relatedCard}
                        onClick={(event) => { event.preventDefault(); openRelated(stone); }}
                      >
                        <span className={styles.relatedImage}>
                          <Image
                            src={storageVariant(primary.url, 640)}
                            alt={primary.alt}
                            fill
                            sizes="(max-width: 700px) 46vw, (max-width: 980px) 40vw, 260px"
                            quality={95}
                            loading="lazy"
                          />
                        </span>
                        <span className={styles.relatedCopy}>
                          <small>{stone.family} · {stone.sku}</small>
                          <strong>{stone.title}</strong>
                          <span>{stone.publicWeight} · {stone.origin}</span>
                        </span>
                        <i>Available</i>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function DeferredCardImage({ image }: { image: GalleryImage }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || nearViewport) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNearViewport(true);
      observer.disconnect();
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [nearViewport]);

  return (
    <span ref={containerRef} className={styles.cardMedia}>
      {nearViewport && (
        <Image
          src={storageVariant(image.url, 720)}
          alt={image.alt}
          fill
          sizes={gallerySizes.card}
          quality={95}
          loading="lazy"
        />
      )}
    </span>
  );
}

function InquiryForm({ stone }: { stone: GalleryStone }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const primary = stone.images.find((i) => i.isPrimary) ?? stone.images[0];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const form = new FormData(e.currentTarget);
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        gemstone: stone.title,
        message: form.get("message"),
        stoneId: stone.sku,
        stoneStatus: stone.status,
        pageUrl: location.href,
        primaryImage: primary.storageKey,
      }),
    });
    setState(response.ok ? "sent" : "error");
  }
  if (state === "sent")
    return <p role="status">Your inquiry was sent successfully.</p>;
  return (
    <form className={styles.form} onSubmit={submit}>
      <label>
        Name
        <input name="name" required maxLength={120} />
      </label>
      <label>
        Email
        <input name="email" type="email" required maxLength={254} />
      </label>
      <label>
        Phone
        <input name="phone" maxLength={60} />
      </label>
      <label>
        Message
        <textarea
          name="message"
          required
          defaultValue={inquiryMessage(stone.status, stone.title, stone.sku)}
          maxLength={4000}
        />
      </label>
      <button className={styles.cta} disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send inquiry"}
      </button>
      {state === "error" && (
        <p role="alert">Your inquiry could not be sent. Please try again.</p>
      )}
      <small>
        Your inquiry includes this stone’s reference automatically. We’ll only
        use your details to respond.
      </small>
    </form>
  );
}
