import { NextRequest, NextResponse } from 'next/server';
import seedTasksData from '../../data/incomingTasks.json';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory quest store (pre-seeded from static JSON)
// Resets on server restart — fine for hackathon demo.
// ─────────────────────────────────────────────────────────────────────────────
export type Quest = {
	eta: string;
	id: string;
	lane: string;
	location: string;
	locationArea: string;
	markerLabel: string;
	priority: 'high' | 'medium' | 'low';
	requiredSkill: string;
	reward: string;
	summary: string;
	title: string;
	type: string;
	/** Quest lifecycle status */
	status: 'open' | 'accepted' | 'completed';
	/** ISO timestamp when the agent pushed this quest */
	createdAt?: string;
	/** ISO timestamp when a user accepted this quest */
	acceptedAt?: string;
	/** e.g. "blaxel-agent-shibuya-v1" */
	agentId?: string;
};

export const questStore: Map<string, Quest> = new Map(
	(seedTasksData as Omit<Quest, 'status'>[]).map((q) => [
		q.id,
		{ ...q, status: 'open' as const },
	]),
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quests  — return all quests ordered by creation time (newest first)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
	const quests = Array.from(questStore.values()).reverse();
	return NextResponse.json({ quests });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/quests  — Blaxel agent pushes a new quest
//
// Required header: Authorization: Bearer <QUEST_API_SECRET>
// Body: Partial<Quest> — at minimum { title, summary, location, type }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
	// Auth check
	const secret = process.env.QUEST_API_SECRET;
	const authHeader = req.headers.get('Authorization') ?? '';
	const token = authHeader.replace(/^Bearer\s+/i, '');

	if (secret && token !== secret) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: Partial<Quest>;
	try {
		body = (await req.json()) as Partial<Quest>;
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
	}

	// Validate required fields
	if (!body.title || !body.summary || !body.location || !body.type) {
		return NextResponse.json(
			{ error: 'Missing required fields: title, summary, location, type' },
			{ status: 422 },
		);
	}

	// Build quest with sensible defaults
	const now = new Date().toISOString();
	const id = body.id ?? `agent-quest-${Date.now()}`;

	const quest: Quest = {
		eta: body.eta ?? 'ETA unknown',
		id,
		lane: body.lane ?? 'Agent lane',
		location: body.location,
		locationArea: body.locationArea ?? body.location,
		markerLabel: body.markerLabel ?? body.type.slice(0, 4).toUpperCase(),
		priority: body.priority ?? 'medium',
		requiredSkill: body.requiredSkill ?? body.type,
		reward: body.reward ?? '+20 XP',
		summary: body.summary,
		title: body.title,
		type: body.type,
		status: 'open',
		createdAt: now,
		agentId: body.agentId,
	};

	questStore.set(id, quest);

	return NextResponse.json({ quest }, { status: 201 });
}
