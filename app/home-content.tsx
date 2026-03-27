"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";

const MOCK_PREVIEW_CELLS = [
  { duration: "0:12", views: "128K" },
  { duration: "0:24", views: "42.1K" },
  { duration: "0:08", views: "902K" },
  { duration: "0:31", views: "12.4K" },
];

const STEPS = [
  {
    n: "01",
    title: "검색",
    desc: "키워드·해시태그로 TikTok·Douyin 영상을 한 번에 찾습니다.",
  },
  {
    n: "02",
    title: "분석",
    desc: "조회·반응 데이터로 트렌드와 포맷을 빠르게 파악합니다.",
  },
  {
    n: "03",
    title: "활용",
    desc: "다운로드·자막 추출로 기획과 제작에 바로 연결합니다.",
  },
];

export default function HomeContent() {
  const [brandPulse, setBrandPulse] = useState(false);

  const handleBrandClick = () => {
    setBrandPulse(true);
    setTimeout(() => setBrandPulse(false), 500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgMesh} aria-hidden />
      <div className={styles.bgGrain} aria-hidden />

      <div className={styles.inner}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>ShortMama · 숏폼 워크스페이스</p>
            <h1 className={styles.headline}>
              <button
                type="button"
                className={`${styles.wordmark} ${brandPulse ? styles.wordmarkPulse : ""}`}
                onClick={handleBrandClick}
                aria-label="숏마마"
              >
                숏마마
              </button>
            </h1>
            <p className={styles.lead}>
              글로벌·중국 숏폼을 데이터로 읽고, 검색부터 자막·다운로드까지 한 흐름으로.
            </p>
            <div className={styles.heroActions}>
              <Link href="/auth/signup" className={styles.ctaPrimary}>
                무료로 시작하기
              </Link>
              <Link href="/auth/login" className={styles.ctaGhost}>
                로그인
              </Link>
            </div>
            <p className={styles.microNote}>
              TikTok·Douyin은 각 회사의 상표입니다.
            </p>
          </div>

          <div className={styles.heroPanel} aria-hidden>
            <div className={styles.mockChrome}>
              <span className={styles.mockDot} />
              <span className={styles.mockDot} />
              <span className={styles.mockDot} />
            </div>
            <div className={styles.mockBody}>
              <div className={styles.mockSearchRow}>
                <span className={styles.mockInput} />
                <span className={styles.mockBtn} />
              </div>
              <div className={styles.mockTags}>
                <span className={styles.mockTag}>TikTok</span>
                <span className={styles.mockTagMuted}>Douyin</span>
              </div>
              <div className={styles.mockGrid}>
                {MOCK_PREVIEW_CELLS.map((cell, i) => (
                  <div key={i} className={styles.mockCell}>
                    <div className={styles.mockCellBg} aria-hidden />
                    <div className={styles.mockCellShine} aria-hidden />
                    <div className={styles.mockCellWave} aria-hidden>
                      <span className={styles.mockWaveBar} />
                      <span className={styles.mockWaveBar} />
                      <span className={styles.mockWaveBar} />
                      <span className={styles.mockWaveBar} />
                      <span className={styles.mockWaveBar} />
                      <span className={styles.mockWaveBar} />
                      <span className={styles.mockWaveBar} />
                    </div>
                    <span className={styles.mockCellDuration}>{cell.duration}</span>
                    <div className={styles.mockCellPlay} aria-hidden>
                      <span className={styles.mockCellPlayInner} />
                    </div>
                    <div className={styles.mockCellFooter}>
                      <span className={styles.mockCellViews}>{cell.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className={styles.stepsSection} aria-labelledby="steps-heading">
          <h2 id="steps-heading" className={styles.sectionTitle}>
            이렇게 이어집니다
          </h2>
          <ol className={styles.stepList}>
            {STEPS.map((step) => (
              <li key={step.n} className={styles.stepCard}>
                <span className={styles.stepNum}>{step.n}</span>
                <span className={styles.stepTitle}>{step.title}</span>
                <p className={styles.stepDesc}>{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.stripSection}>
          <p className={styles.stripLabel}>지원 플랫폼</p>
          <div className={styles.stripPills}>
            <span className={styles.pill}>TikTok</span>
            <span className={styles.pill}>Douyin</span>
          </div>
        </section>

        <div className={styles.bottomCta}>
          <Link href="/auth/signup" className={styles.ctaPrimaryWide}>
            지금 시작하기
            <span className={styles.ctaArrow} aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
