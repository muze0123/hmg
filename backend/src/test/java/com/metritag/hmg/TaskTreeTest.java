package com.metritag.hmg;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static com.metritag.hmg.TaskTree.*;

class TaskTreeTest {
 private Node node(Level level) {
  Node node = new Node();
  node.level = level;
  node.executor = "executor";
  node.reviewers = new ArrayList<>(List.of("reviewer"));
  node.state = State.ACTIVE;
  return node;
 }
 private TaskTree tree() {
  TaskTree tree = new TaskTree();
  tree.root = node(Level.MAIN);
  return tree;
 }
 @Test void parentWaitsForEveryChildAndItsOwnApproval() {
  TaskTree tree = tree();
  Node section = node(Level.SECTION);
  Node first = node(Level.SUBTASK);
  Node second = node(Level.SUBTASK);
  section.children.addAll(List.of(first, second));
  tree.root.children.add(section);
  tree.submit(first, "executor");
  tree.review(first, "reviewer", true, "");
  assertThat(section.state).isEqualTo(State.ACTIVE);
  tree.submit(second, "executor");
  tree.review(second, "reviewer", true, "");
  assertThat(section.state).isEqualTo(State.REVIEWING);
  assertThat(tree.root.state).isEqualTo(State.ACTIVE);
  tree.review(section, "reviewer", true, "");
  assertThat(tree.root.state).isEqualTo(State.REVIEWING);
 }
 @Test void rejectionDoesNotUnlockApprovedChildren() {
  TaskTree tree = tree();
  Node section = node(Level.SECTION);
  section.state = State.COMPLETED;
  tree.root.children.add(section);
  tree.root.state = State.REVIEWING;
  tree.review(tree.root, "reviewer", false, "Revise main information");
  assertThat(section.state).isEqualTo(State.COMPLETED);
  tree.submit(tree.root, "executor");
  assertThat(tree.root.state).isEqualTo(State.REVIEWING);
  assertThat(tree.history).extracting(History::action).containsExactly("REJECT", "SUBMIT");
 }
 @Test void sequentialWorkflowRequiresEveryReviewer() {
  TaskTree tree = tree();
  Node task = node(Level.SUBTASK);
  task.reviewers = new ArrayList<>(List.of("first", "second"));
  tree.root.children.add(task);
  tree.submit(task, "executor");
  assertThatThrownBy(() -> tree.review(task, "second", true, "")).isInstanceOf(BusinessException.class);
  tree.review(task, "first", true, "");
  assertThat(task.state).isEqualTo(State.REVIEWING);
  tree.review(task, "second", true, "");
  assertThat(task.state).isEqualTo(State.COMPLETED);
 }
 @Test void cannotSubmitParentWithIncompleteChildrenOrReviewWithoutReason() {
  TaskTree tree = tree();
  tree.root.children.add(node(Level.SECTION));
  assertThatThrownBy(() -> tree.submit(tree.root, "executor")).isInstanceOf(BusinessException.class);
  Node child = node(Level.SUBTASK);
  tree.submit(child, "executor");
  assertThatThrownBy(() -> tree.review(child, "reviewer", false, " ")).isInstanceOf(BusinessException.class);
 }
 @Test void draftWithdrawAndVoidAreRealTransitions() {
  TaskTree tree = tree();
  tree.submitDraft(tree.root, "executor");
  assertThat(tree.root.state).isEqualTo(State.SUBMITTING);
  tree.withdraw(tree.root, "executor");
  assertThat(tree.root.state).isEqualTo(State.WITHDRAWN);
  tree.submitDraft(tree.root, "executor");
  assertThat(tree.root.state).isEqualTo(State.SUBMITTING);
  tree.voidTask(tree.root, "executor");
  assertThat(tree.root.state).isEqualTo(State.VOIDED);
  assertThat(tree.history).extracting(History::action).containsExactly("SUBMIT_DRAFT", "WITHDRAW", "SUBMIT_DRAFT", "VOID");
 }
 @Test void frontendCodesAndAggregateRuleMatchTheFrontEnd() {
  assertThat(frontendCode(State.SUBMITTING)).isEqualTo("submitting");
  assertThat(frontendCode(State.WITHDRAWN)).isEqualTo("withdrawn");
  assertThat(frontendCode(State.VOIDED)).isEqualTo("voided");
  assertThat(aggregateStatus(List.of(FrontendStatus.PENDING, FrontendStatus.PENDING))).isEqualTo(FrontendStatus.PENDING);
  assertThat(aggregateStatus(List.of(FrontendStatus.COMPLETED, FrontendStatus.REVIEWING))).isEqualTo(FrontendStatus.ACTIVE);
  assertThat(aggregateStatus(List.of())).isEqualTo(FrontendStatus.PENDING);
 }
 @Test void mainWithdrawalPausesOpenDescendantsWithoutOverwritingProgress() {
  TaskTree tree = tree();
  Node section = node(Level.SECTION);
  Node filling = node(Level.SUBTASK);
  Node reviewing = node(Level.SUBTASK); reviewing.state = State.REVIEWING;
  reviewing.workflowInstanceId = "wf"; reviewing.approvalId = "approval"; reviewing.workflowRevision = "v1";
  Node completed = node(Level.SUBTASK); completed.state = State.COMPLETED;
  Node voided = node(Level.SUBTASK); voided.state = State.VOIDED;
  section.children.addAll(List.of(filling, reviewing, completed, voided)); tree.root.children.add(section);
  tree.root.state = State.REVIEWING;
  tree.withdraw(tree.root, "executor");
  assertThat(tree.root.state).isEqualTo(State.WITHDRAWN);
  assertThat(tree.isPaused(section)).isTrue(); assertThat(tree.isPaused(filling)).isTrue();
  assertThat(tree.isPaused(completed)).isFalse(); assertThat(tree.isPaused(voided)).isFalse();
  assertThat(filling.state).isEqualTo(State.ACTIVE); assertThat(reviewing.state).isEqualTo(State.REVIEWING);
  assertThatThrownBy(() -> tree.submit(filling, "executor")).isInstanceOf(BusinessException.class);
  assertThatThrownBy(() -> tree.review(reviewing, "reviewer", true, "")).isInstanceOf(BusinessException.class);
  assertThat(tree.matchesCallback(reviewing, "wf", "approval", "v1")).isFalse();
  // Resubmission alone does not resume children. Execution confirmation owns this latch.
  tree.root.state = State.ACTIVE; assertThat(tree.isPaused(filling)).isTrue();
  tree.descendantsPaused = false; assertThat(tree.isPaused(filling)).isFalse();
  assertThat(tree.matchesCallback(reviewing, "wf", "approval", "v1")).isTrue();
 }
}
