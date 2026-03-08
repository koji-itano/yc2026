import { NextRequest, NextResponse } from 'next/server';
import { questStore } from '../route';

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/quests/[id]  — update quest status (accept / complete)
//
// Body: { status: "accepted" | "completed" }
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const quest = questStore.get(id);

	if (!quest) {
		return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
	}

	let body: { status?: string };
	try {
		body = (await req.json()) as { status?: string };
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (body.status !== 'accepted' && body.status !== 'completed') {
		return NextResponse.json(
			{ error: 'status must be "accepted" or "completed"' },
			{ status: 422 },
		);
	}

	const updated = {
		...quest,
		status: body.status as 'accepted' | 'completed',
		...(body.status === 'accepted' ? { acceptedAt: new Date().toISOString() } : {}),
	};

	questStore.set(id, updated);

	return NextResponse.json({ quest: updated });
}
