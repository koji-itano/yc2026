'use client';


import { useEffect, useRef, useState } from 'react';

type Quest = {
  eta: string;
  id: string;
  location: string;
  priority: string;
  reward: string;
  summary: string;
  title: string;
  type: string;
  status: 'open' | 'accepted' | 'completed';
  createdAt?: string;
  acceptedAt?: string;
  agentId?: string;
};

const AGENT_ID = 'yaoyorozu-shrine-agent-v1';
const POLL_MS = 4000;

function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const STATUS_STYLE: Record<Quest['status'], { label: string; color: string; bg: string; border: string }> = {
  open:      { label: 'OPEN',     color: '#7a9aff', bg: 'rgba(78,140,255,0.1)',  border: 'rgba(78,140,255,0.3)'  },
  accepted:  { label: 'ACCEPTED', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)' },
  completed: { label: 'DONE',     color: '#c4aeff', bg: 'rgba(142,107,255,0.1)',border: 'rgba(142,107,255,0.3)'},
};

const PRIORITY_COLOR: Record<string, string> = {
  high: '#f87171', medium: '#fbbf24', low: '#6ee7b7',
};

export default function CompanyPage() {
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [agentQuests, setAgentQuests] = useState<Quest[]>([]);
  const [lastPing, setLastPing] = useState<string>('—');
  const [totalPushed, setTotalPushed] = useState(0);
  const prevPushedRef = useRef(0);

  // Live polling state
  const [fetching, setFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(POLL_MS / 1000);
  const [newQuestFlash, setNewQuestFlash] = useState(false);
  const lastFetchedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      setFetching(true);
      try {
        const res = await fetch('/api/quests', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { quests: Quest[] };
        const all = data.quests;
        const mine = all.filter((q) => q.agentId === AGENT_ID);

        if (cancelled) return;
        setAllQuests(all);
        setAgentQuests(mine);
        setLastUpdated(new Date());
        lastFetchedAtRef.current = Date.now();

        // Track last time this agent pushed a quest
        if (mine.length > 0) {
          const latest = mine.reduce((a, b) =>
            (a.createdAt ?? '') > (b.createdAt ?? '') ? a : b
          );
          if (latest.createdAt) setLastPing(timeAgo(latest.createdAt));
        }

        // Count total pushed by this agent (across all time)
        if (mine.length > prevPushedRef.current) {
          const isFirst = prevPushedRef.current === 0;
          prevPushedRef.current = mine.length;
          setTotalPushed(mine.length);
          if (!isFirst) {
            setNewQuestFlash(true);
            setTimeout(() => setNewQuestFlash(false), 1500);
          }
        }
      } catch { /* ignore */ }
      finally {
        if (!cancelled) setFetching(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Date.now() - lastFetchedAtRef.current;
      const remaining = Math.max(0, Math.ceil((POLL_MS - elapsed) / 1000));
      setCountdown(remaining);
    }, 500);
    return () => clearInterval(tick);
  }, []);

  const open     = agentQuests.filter((q) => q.status === 'open').length;
  const accepted = agentQuests.filter((q) => q.status === 'accepted').length;
  const isOnline = agentQuests.length > 0;

  return (
    <main className="companyPage">
      <section className="companyShell">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="companyHeader">
          <div>
            <span className="companyEyebrow">Company Console</span>
            <h1>Agent Dashboard</h1>
            <p>Track your AI agent's activity and review all quests it has issued to the platform.</p>
          </div>
          <div className="companyHeaderActions">
            {/* ── Live polling indicator ── */}
            <div className="companyLiveBar">
              <span className={`companyLiveDot${fetching ? ' companyLiveFetching' : ''}`} />
              <span className="companyLiveLabel">LIVE</span>
              <span className="companyLiveDetail">
                {fetching
                  ? 'Syncing…'
                  : lastUpdated
                    ? `Updated ${formatTime(lastUpdated)} · next in ${countdown}s`
                    : 'Connecting…'}
              </span>
            </div>

          </div>
        </header>

        {/* ── Agent Status Card ─────────────────────────────────── */}
        <div className="companyAgentCard">
          <div className="companyAgentCardLeft">
            <span className={`companyAgentDot${isOnline ? ' companyAgentDotOnline' : ''}`} />
            <div>
              <strong className="companyAgentName">⛩ Yaoyorozu Shrine</strong>
              <span className="companyAgentMeta">
                Blaxel Sandbox · 6 surveillance cameras active
              </span>
            </div>
          </div>
          <div className="companyAgentStats">
            <div className="companyAgentStat">
              <strong>{totalPushed}</strong>
              <span>Quests pushed</span>
            </div>
            <div className="companyAgentStat">
              <strong>{open}</strong>
              <span>Open</span>
            </div>
            <div className="companyAgentStat">
              <strong>{accepted}</strong>
              <span>Accepted</span>
            </div>
            <div className="companyAgentStat">
              <strong>{lastPing}</strong>
              <span>Last activity</span>
            </div>
          </div>
        </div>

        {/* ── Quest Table ───────────────────────────────────────── */}
        <div className="companySection">
          <div className={`companySectionHeader${newQuestFlash ? ' companyQuestFlash' : ''}`}>
            <h2>Quests from this agent</h2>
            <span>{agentQuests.length} total</span>
          </div>

          {agentQuests.length === 0 ? (
            <div className="companyEmpty">
              <span>🤖</span>
              <p>No quests pushed yet. Start the Blaxel agent to generate quests.</p>
            </div>
          ) : (
            <div className="companyQuestList">
              {agentQuests.map((q) => {
                const st = STATUS_STYLE[q.status];
                return (
                  <div key={q.id} className="companyQuestRow">
                    <div className="companyQuestLeft">
                      <span
                        className="companyStatusChip"
                        style={{ color: st.color, background: st.bg, borderColor: st.border }}
                      >
                        {st.label}
                      </span>
                      <div>
                        <strong className="companyQuestTitle">{q.title}</strong>
                        <span className="companyQuestMeta">
                          📍 {q.location} · {q.type}
                        </span>
                      </div>
                    </div>
                    <div className="companyQuestRight">
                      <span
                        className="companyPriorityChip"
                        style={{ color: PRIORITY_COLOR[q.priority] ?? '#fff' }}
                      >
                        {q.priority.toUpperCase()}
                      </span>
                      <span className="companyQuestTime">
                        {q.status === 'accepted' && q.acceptedAt
                          ? `✓ accepted ${timeAgo(q.acceptedAt)}`
                          : `pushed ${timeAgo(q.createdAt)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── All quests summary ─────────────────────────────────── */}
        <div className="companySection">
          <div className="companySectionHeader">
            <h2>Platform overview</h2>
            <span>{allQuests.length} total quests</span>
          </div>
          <div className="companyStatRow">
            <div className="companyBigStat">
              <strong>{allQuests.filter((q) => q.status === 'open').length}</strong>
              <span>Open</span>
            </div>
            <div className="companyBigStat">
              <strong>{allQuests.filter((q) => q.status === 'accepted').length}</strong>
              <span>Accepted</span>
            </div>
            <div className="companyBigStat">
              <strong>{allQuests.filter((q) => q.agentId).length}</strong>
              <span>Agent-pushed</span>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
