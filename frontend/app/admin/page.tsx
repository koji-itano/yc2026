'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import incomingTasksData from '../data/incomingTasks.json';
import type { AdminCandidate, AdminTask } from '../lib/adminMatching';

const tasks = incomingTasksData as AdminTask[];
const CANDIDATES_PER_PAGE = 3;

function formatPriority(priority: AdminTask['priority']) {
	return priority.charAt(0).toUpperCase() + priority.slice(1);
}

type CandidateFetchState =
	| {
			candidates: AdminCandidate[];
			status: 'success';
	  }
	| {
			error: string;
			status: 'error';
	  }
	| {
			status: 'idle' | 'loading';
	  };

type AssignmentRecord = Pick<
	AdminCandidate,
	'company' | 'id' | 'location' | 'name' | 'title'
>;

export default function AdminPage() {
	const [assignments, setAssignments] = useState<
		Record<string, AssignmentRecord>
	>({});
	const [candidateStates, setCandidateStates] = useState<
		Record<string, CandidateFetchState>
	>({});
	const [candidatePage, setCandidatePage] = useState(1);
	const [selectedTaskId, setSelectedTaskId] = useState<string>(
		() => tasks[0]?.id ?? '',
	);
	const candidateStatesRef = useRef<Record<string, CandidateFetchState>>({});

	const selectedTask =
		tasks.find((task) => task.id === selectedTaskId) ??
		tasks.find((task) => !assignments[task.id]) ??
		tasks[0];

	const selectedTaskState = selectedTask
		? candidateStates[selectedTask.id]
		: undefined;
	const rankedCandidates =
		selectedTaskState?.status === 'success'
			? selectedTaskState.candidates
			: [];
	const selectedAssignee = selectedTask
		? assignments[selectedTask.id]
		: undefined;
	const selectedTaskIdKey = selectedTask?.id;
	const totalCandidatePages = Math.max(
		1,
		Math.ceil(rankedCandidates.length / CANDIDATES_PER_PAGE),
	);
	const clampedCandidatePage = Math.min(candidatePage, totalCandidatePages);
	const candidatePageStart = (clampedCandidatePage - 1) * CANDIDATES_PER_PAGE;
	const paginatedCandidates = rankedCandidates.slice(
		candidatePageStart,
		candidatePageStart + CANDIDATES_PER_PAGE,
	);

	useEffect(() => {
		candidateStatesRef.current = candidateStates;
	}, [candidateStates]);

	useEffect(() => {
		if (!selectedTask || !selectedTaskIdKey) {
			return;
		}

		const existingState = candidateStatesRef.current[selectedTaskIdKey];

		if (
			existingState?.status === 'success' ||
			existingState?.status === 'error' ||
			existingState?.status === 'loading'
		) {
			return;
		}

		const controller = new AbortController();
		const taskId = selectedTask.id;

		async function loadCandidates() {
			setCandidateStates((current) => ({
				...current,
				[taskId]: {
					status: 'loading',
				},
			}));

			const response = await fetch(
				`/api/admin/candidates?taskId=${taskId}`,
				{
					cache: 'no-store',
					signal: controller.signal,
				},
			);
			const payload = (await response.json()) as {
				candidates?: AdminCandidate[];
				error?: string;
			};

			if (!response.ok || !Array.isArray(payload.candidates)) {
				throw new Error(
					payload.error ?? 'Unable to load candidates right now.',
				);
			}

			const candidates = payload.candidates;

			setCandidateStates((current) => ({
				...current,
				[taskId]: {
					candidates,
					status: 'success',
				},
			}));
		}

		loadCandidates().catch((error: unknown) => {
			if (controller.signal.aborted) {
				return;
			}

			setCandidateStates((current) => ({
				...current,
				[taskId]: {
					error:
						error instanceof Error
							? error.message
							: 'Unable to load candidates right now.',
					status: 'error',
				},
			}));
		});

		return () => {
			controller.abort();
		};
	}, [selectedTask, selectedTaskIdKey]);

	function handleAssign(taskId: string, candidate: AdminCandidate) {
		setAssignments((current) => ({
			...current,
			[taskId]: {
				company: candidate.company,
				id: candidate.id,
				location: candidate.location,
				name: candidate.name,
				title: candidate.title,
			},
		}));
	}

	return (
		<main className="adminPage">
			<section className="adminShell">
				<header className="adminHeader">
					<div>
						<span className="adminEyebrow">Ops Console</span>
						<h1>Human Resource Matching</h1>
						<p>
							Review live tasks, inspect ranked candidates, and
							assign the best operator without leaving the
							dispatch queue.
						</p>
					</div>
					<div className="adminHeaderActions">
						<div className="adminHeaderStat">
							<strong>{tasks.length}</strong>
							<span>Open tasks</span>
						</div>
						<div className="adminHeaderStat">
							<strong>{Object.keys(assignments).length}</strong>
							<span>Assigned</span>
						</div>
						<Link
							className="adminBackLink"
							href="/"
						>
							Back to map
						</Link>
					</div>
				</header>

				<div className="adminGrid">
					<section className="adminPanel adminQueuePanel">
						<div className="adminPanelHeader">
							<h2>Task Queue</h2>
							<span>{tasks.length} live</span>
						</div>
						<div className="adminQueueList">
							{tasks.map((task) => {
								const assignedWorker = assignments[task.id];
								const isSelected = task.id === selectedTask?.id;
								const isAssigned = Boolean(assignedWorker);

								return (
									<button
										className={`adminQueueItem${isSelected ? ' adminQueueItemSelected' : ''}`}
										key={task.id}
										onClick={() => {
											setSelectedTaskId(task.id);
											setCandidatePage(1);
										}}
										type="button"
									>
										<div className="adminQueueTopline">
											<span className="adminQueueLane">
												{task.lane}
											</span>
											<span
												className={`adminChip adminChipPriority adminChip${formatPriority(task.priority)}`}
											>
												{formatPriority(task.priority)}
											</span>
										</div>
										<strong>{task.title}</strong>
										<p>{task.location}</p>
										<div className="adminQueueMeta">
											<span
												className={`adminChip ${isAssigned ? 'adminChipAssigned' : 'adminChipOpen'}`}
											>
												{isAssigned
													? 'Assigned'
													: 'Open'}
											</span>
											<span className="adminChip">
												{task.requiredSkill}
											</span>
										</div>
										{assignedWorker ? (
											<span className="adminAssigneeTag">
												Assigned to{' '}
												{assignedWorker.name}
											</span>
										) : null}
									</button>
								);
							})}
						</div>
					</section>

					<section className="adminPanel adminTaskPanel">
						{selectedTask ? (
							<>
								<div className="adminPanelHeader">
									<h2>Selected Task</h2>
									<span>{selectedTask.eta}</span>
								</div>
								<div className="adminTaskHero">
									<div>
										<div className="adminTaskBadges">
											<span
												className={`adminChip adminChipPriority adminChip${formatPriority(selectedTask.priority)}`}
											>
												{formatPriority(
													selectedTask.priority,
												)}
											</span>
											<span className="adminChip">
												{selectedTask.type}
											</span>
											<span className="adminChip">
												{selectedTask.requiredSkill}
											</span>
										</div>
										<h3>{selectedTask.title}</h3>
										<p>{selectedTask.summary}</p>
									</div>
									<div className="adminTaskReward">
										{selectedTask.reward}
									</div>
								</div>

								<dl className="adminTaskFacts">
									<div>
										<dt>Location</dt>
										<dd>{selectedTask.location}</dd>
									</div>
									<div>
										<dt>Coverage zone</dt>
										<dd>{selectedTask.locationArea}</dd>
									</div>
									<div>
										<dt>Dispatch lane</dt>
										<dd>{selectedTask.lane}</dd>
									</div>
									<div>
										<dt>Current assignee</dt>
										<dd>
											{selectedAssignee?.name ??
												'Unassigned'}
										</dd>
									</div>
								</dl>

								<div className="adminAssignmentNotice">
									<strong>
										{selectedAssignee
											? `Assigned to ${selectedAssignee.name}`
											: 'Awaiting assignment'}
									</strong>
									<span>
										{selectedAssignee
											? `${selectedAssignee.title} • ${selectedAssignee.company} • ${selectedAssignee.location}`
											: 'Review the ranked list and approve the best human operator.'}
									</span>
								</div>
							</>
						) : null}
					</section>

					<section className="adminPanel adminCandidatesPanel">
						<div className="adminPanelHeader">
							<div>
								<h2>Ranked Candidates</h2>
								<span>Live from Crustdata</span>
							</div>
							{selectedTaskState?.status === 'success' &&
							rankedCandidates.length > 0 ? (
								<div className="adminPagination">
									<span className="adminPaginationMeta">
										{candidatePageStart + 1}-
										{Math.min(
											candidatePageStart +
												CANDIDATES_PER_PAGE,
											rankedCandidates.length,
										)}{' '}
										/ {rankedCandidates.length}
									</span>
									<button
										className="adminPaginationButton"
										disabled={clampedCandidatePage === 1}
										onClick={() =>
											setCandidatePage((current) =>
												Math.max(1, current - 1),
											)
										}
										type="button"
									>
										Prev
									</button>
									<button
										className="adminPaginationButton"
										disabled={
											clampedCandidatePage ===
											totalCandidatePages
										}
										onClick={() =>
											setCandidatePage((current) =>
												Math.min(
													totalCandidatePages,
													current + 1,
												),
											)
										}
										type="button"
									>
										Next
									</button>
								</div>
							) : null}
						</div>
						{selectedTaskState?.status === 'loading' ||
						!selectedTaskState ? (
							<div className="adminCandidatesState">
								<strong>Searching Crustdata</strong>
								<p>
									Looking for people in Tokyo whose profile
									fits{' '}
									{selectedTask?.requiredSkill ?? 'this task'}
									.
								</p>
							</div>
						) : null}

						{selectedTaskState?.status === 'error' ? (
							<div className="adminCandidatesState adminCandidatesStateError">
								<strong>Candidate search unavailable</strong>
								<p>{selectedTaskState.error}</p>
							</div>
						) : null}

						{selectedTaskState?.status === 'success' &&
						rankedCandidates.length === 0 ? (
							<div className="adminCandidatesState">
								<strong>No matching profiles found</strong>
								<p>
									Crustdata returned no candidates for this
									task profile. Try another task or broaden
									the search profile.
								</p>
							</div>
						) : null}

						{selectedTaskState?.status === 'success' &&
						rankedCandidates.length > 0 ? (
							<div className="adminCandidatesList">
								{paginatedCandidates.map((candidate, index) => {
									const rank = candidatePageStart + index + 1;
									const isAssigned = selectedTask
										? assignments[selectedTask.id]?.id ===
											candidate.id
										: false;

									return (
										<article
											className={`adminCandidateCard${rank <= 3 ? ' adminCandidateCardTop' : ''}`}
											key={candidate.id}
										>
											<div className="adminCandidateHeader">
												<div>
													<span className="adminCandidateRank">
														#{rank} match
													</span>
													<h3>{candidate.name}</h3>
													<p className="adminCandidateCompany">
														{candidate.title} at{' '}
														{candidate.company}
													</p>
												</div>
												<div className="adminCandidateScore">
													{candidate.score}
												</div>
											</div>
											<div className="adminCandidateMeta">
												<span
													className={`adminChip adminChipProfile adminChipProfile${candidate.profileConfidence}`}
												>
													{
														candidate.profileConfidence
													}{' '}
													confidence
												</span>
												<span className="adminChip">
													{candidate.distanceLabel}
												</span>
												<span className="adminChip">
													{candidate.location}
												</span>
											</div>
											<p className="adminCandidateSummary">
												{candidate.headline}
											</p>
											<ul className="adminReasonList">
												{candidate.reasons.map(
													(reason) => (
														<li key={reason}>
															{reason}
														</li>
													),
												)}
											</ul>
											<div className="adminCandidateActions">
												{candidate.linkedinUrl ? (
													<a
														className="adminExternalLink"
														href={
															candidate.linkedinUrl
														}
														rel="noreferrer"
														target="_blank"
													>
														Open profile
													</a>
												) : null}
												<button
													className={`adminAssignButton${isAssigned ? ' adminAssignButtonAssigned' : ''}`}
													onClick={() =>
														selectedTask &&
														handleAssign(
															selectedTask.id,
															candidate,
														)
													}
													type="button"
												>
													{isAssigned
														? 'Assigned'
														: 'Assign'}
												</button>
											</div>
										</article>
									);
								})}
							</div>
						) : null}
					</section>
				</div>
			</section>
		</main>
	);
}
