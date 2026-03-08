"use client";

import Link from "next/link";
import { useState } from "react";
import incomingTasksData from "../data/incomingTasks.json";
import workersData from "../data/workers.json";
import { rankCandidates, type AdminTask, type RankedCandidate, type Worker } from "../lib/adminMatching";

const tasks = incomingTasksData as AdminTask[];
const workers = workersData as Worker[];

function formatAvailability(availability: Worker["availability"]) {
  if (availability === "available") {
    return "Available";
  }

  if (availability === "busy") {
    return "Busy";
  }

  return "Offline";
}

function formatPriority(priority: AdminTask["priority"]) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export default function AdminPage() {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => tasks[0]?.id ?? "");

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ??
    tasks.find((task) => !assignments[task.id]) ??
    tasks[0];

  const rankedCandidates: RankedCandidate[] = selectedTask ? rankCandidates(selectedTask, workers) : [];
  const selectedAssignee = selectedTask ? workers.find((worker) => worker.id === assignments[selectedTask.id]) : undefined;

  function handleAssign(taskId: string, workerId: string) {
    setAssignments((current) => ({
      ...current,
      [taskId]: workerId,
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
              Review live tasks, inspect ranked candidates, and assign the best operator without leaving the dispatch queue.
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
            <Link className="adminBackLink" href="/">
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
                const assignedWorker = workers.find((worker) => worker.id === assignments[task.id]);
                const isSelected = task.id === selectedTask?.id;
                const isAssigned = Boolean(assignedWorker);

                return (
                  <button
                    className={`adminQueueItem${isSelected ? " adminQueueItemSelected" : ""}`}
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    type="button"
                  >
                    <div className="adminQueueTopline">
                      <span className="adminQueueLane">{task.lane}</span>
                      <span className={`adminChip adminChipPriority adminChip${formatPriority(task.priority)}`}>
                        {formatPriority(task.priority)}
                      </span>
                    </div>
                    <strong>{task.title}</strong>
                    <p>{task.location}</p>
                    <div className="adminQueueMeta">
                      <span className={`adminChip ${isAssigned ? "adminChipAssigned" : "adminChipOpen"}`}>
                        {isAssigned ? "Assigned" : "Open"}
                      </span>
                      <span className="adminChip">{task.requiredSkill}</span>
                    </div>
                    {assignedWorker ? <span className="adminAssigneeTag">Assigned to {assignedWorker.name}</span> : null}
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
                      <span className={`adminChip adminChipPriority adminChip${formatPriority(selectedTask.priority)}`}>
                        {formatPriority(selectedTask.priority)}
                      </span>
                      <span className="adminChip">{selectedTask.type}</span>
                      <span className="adminChip">{selectedTask.requiredSkill}</span>
                    </div>
                    <h3>{selectedTask.title}</h3>
                    <p>{selectedTask.summary}</p>
                  </div>
                  <div className="adminTaskReward">{selectedTask.reward}</div>
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
                    <dd>{selectedAssignee?.name ?? "Unassigned"}</dd>
                  </div>
                </dl>

                <div className="adminAssignmentNotice">
                  <strong>{selectedAssignee ? `Assigned to ${selectedAssignee.name}` : "Awaiting assignment"}</strong>
                  <span>
                    {selectedAssignee
                      ? `${formatAvailability(selectedAssignee.availability)} • ${selectedAssignee.homeArea} • ${selectedAssignee.languages.join(", ")}`
                      : "Review the ranked list and approve the best human operator."}
                  </span>
                </div>
              </>
            ) : null}
          </section>

          <section className="adminPanel adminCandidatesPanel">
            <div className="adminPanelHeader">
              <h2>Ranked Candidates</h2>
              <span>Skill + distance</span>
            </div>
            <div className="adminCandidatesList">
              {rankedCandidates.map((candidate, index) => {
                const isAssigned = selectedTask ? assignments[selectedTask.id] === candidate.worker.id : false;

                return (
                  <article
                    className={`adminCandidateCard${index < 3 ? " adminCandidateCardTop" : ""}`}
                    key={candidate.worker.id}
                  >
                    <div className="adminCandidateHeader">
                      <div>
                        <span className="adminCandidateRank">#{index + 1} match</span>
                        <h3>{candidate.worker.name}</h3>
                      </div>
                      <div className="adminCandidateScore">{candidate.score}</div>
                    </div>
                    <div className="adminCandidateMeta">
                      <span className={`adminChip adminChipAvailability adminChip${formatAvailability(candidate.worker.availability)}`}>
                        {formatAvailability(candidate.worker.availability)}
                      </span>
                      <span className="adminChip">{candidate.distanceLabel}</span>
                      <span className="adminChip">{candidate.worker.homeArea}</span>
                    </div>
                    <p className="adminCandidateSummary">
                      Rating {candidate.worker.rating.toFixed(1)} • Load {candidate.worker.currentLoad} • Languages{" "}
                      {candidate.worker.languages.join(", ")}
                    </p>
                    <div className="adminCandidateSkills">
                      {candidate.worker.skills.map((skill) => (
                        <span className="adminSkillPill" key={skill}>
                          {skill}
                        </span>
                      ))}
                    </div>
                    <ul className="adminReasonList">
                      {candidate.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                    <div className="adminCandidateActions">
                      <button
                        className={`adminAssignButton${isAssigned ? " adminAssignButtonAssigned" : ""}`}
                        onClick={() => selectedTask && handleAssign(selectedTask.id, candidate.worker.id)}
                        type="button"
                      >
                        {isAssigned ? "Assigned" : "Assign"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
