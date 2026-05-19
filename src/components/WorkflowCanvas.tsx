'use client';

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type EdgeMouseHandler,
  type NodeMouseHandler,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import WorkflowNode, { type WorkflowNodeType } from './nodes/WorkflowNode';
import LabelEdge from './edges/LabelEdge';
import type { PlanStep, WorkflowNodeData, SelectedEdge } from '@/types';
import { GitBranch } from 'lucide-react';

const nodeTypes: NodeTypes = { workflowNode: WorkflowNode };
const edgeTypes: EdgeTypes = { labelEdge: LabelEdge };

// tailwind.config.ts의 colors.f.* 와 동기화 — React Flow는 색상 props로 raw 문자열을 요구하므로
// Tailwind 클래스 대신 토큰 값을 한 곳에서 참조한다.
const CANVAS_COLORS = {
  dot: '#e4e4e7',           // f-dot
  miniMapBg: '#ffffff',     // f-surface
  miniMapBorder: '#e4e4e7', // f-border
  edgeIdle: '#d4d4d8',      // f-border2
  edgeActive: '#2563eb',    // f-accent
  // 항목 2: MiniMap nodeColor 콜백용 상태별 hex
  nodeRunning:  '#2563eb',  // f-accent
  nodeDone:     '#d4d4d8',  // f-border2
  nodeApproved: '#16a34a',  // f-success
  nodeIdle:     '#e4e4e7',  // f-border
} as const;

/** 항목 2: MiniMap nodeColor 콜백 — 노드 data.nodeStatus 기준 */
function miniMapNodeColor(node: Node): string {
  const status = (node.data as WorkflowNodeData | undefined)?.nodeStatus;
  switch (status) {
    case 'running':  return CANVAS_COLORS.nodeRunning;
    case 'done':     return CANVAS_COLORS.nodeDone;
    case 'approved': return CANVAS_COLORS.nodeApproved;
    default:         return CANVAS_COLORS.nodeIdle;
  }
}

interface Props {
  editablePlan: PlanStep[];
  workflowState: string;
  activeStep: number;
  selectedNode: number | null;
  onSelectNode: (idx: number) => void;
  onEdgeClick: (edge: SelectedEdge) => void;
  dfxmlFragments?: Record<number, string>;
  caseTitle?: string;
}

export default function WorkflowCanvas({
  editablePlan, workflowState, activeStep, selectedNode, onSelectNode, onEdgeClick, dfxmlFragments, caseTitle,
}: Props) {
  const getNodeStatus = useCallback(
    (i: number): WorkflowNodeData['nodeStatus'] => {
      if (workflowState === 'done') return 'done';
      if (workflowState === 'running' && i < activeStep) return 'done';
      if (workflowState === 'running' && i === activeStep) return 'running';
      return 'approved';
    },
    [workflowState, activeStep]
  );

  const buildNodeData = useCallback(
    (item: PlanStep, i: number): WorkflowNodeData => ({
      title: item.name,
      tool: item.mcp,
      nodeStatus: getNodeStatus(i),
      nodeIdx: i,
      isSelected: selectedNode === i,
      dfxml: { name: item.name, xml: dfxmlFragments?.[i] ?? '' },
      caseTitle: caseTitle ?? '',
      onSelect: onSelectNode,
    }),
    [getNodeStatus, selectedNode, onSelectNode, dfxmlFragments, caseTitle]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeType>([]);

  const [edges, setEdges] = useEdgesState<Edge>([]);

  // editablePlan이 변경되면 노드 수가 달라질 수 있으므로 위치 포함 재생성
  useEffect(() => {
    setNodes(prev => {
      if (prev.length !== editablePlan.length) {
        // 노드 수 변경 → 기본 위치로 새로 생성
        return editablePlan.map((item, i) => ({
          id: `node-${i}`,
          type: 'workflowNode' as const,
          position: { x: 60 + i * 400, y: 80 },
          data: buildNodeData(item, i),
        }));
      }
      // 노드 수 동일 → 기존 위치(드래그 위치)를 유지하면서 data만 갱신
      return prev.map((node, i) => ({
        ...node,
        data: buildNodeData(editablePlan[i], i),
      }));
    });
  }, [editablePlan, buildNodeData, setNodes]);

  // 상태/선택 변경 시 data만 갱신 (위치 유지)
  useEffect(() => {
    setNodes(prev =>
      prev.map((node, i) => ({
        ...node,
        data: buildNodeData(editablePlan[i] ?? editablePlan[0], i),
      }))
    );
  }, [workflowState, activeStep, selectedNode, buildNodeData, setNodes, editablePlan]);

  // 엣지 갱신
  useEffect(() => {
    setEdges(
      editablePlan.slice(0, -1).map((step, i) => {
        const isActive = workflowState === 'running' && i <= activeStep;
        return {
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
          // 커스텀 엣지: EdgeLabelRenderer로 라벨을 DOM에 렌더해 노드와 겹침 방지
          type: 'labelEdge' as const,
          animated: isActive,
          // label, labelStyle 제거 — data.label로 커스텀 컴포넌트에 전달
          style: { stroke: isActive ? CANVAS_COLORS.edgeActive : CANVAS_COLORS.edgeIdle, strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: isActive ? CANVAS_COLORS.edgeActive : CANVAS_COLORS.edgeIdle,
          },
          data: {
            idx: i,
            isActive,
            label: step.edgeLabel ?? '',
          },
        };
      })
    );
  }, [editablePlan, workflowState, activeStep, setEdges]);

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (event, edge) => {
      event.stopPropagation();
      onEdgeClick({
        idx: (edge.data as { idx: number }).idx,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [onEdgeClick]
  );

  const handleNodeClick: NodeMouseHandler<WorkflowNodeType> = useCallback(
    (_, node) => {
      onSelectNode(node.data.nodeIdx);
    },
    [onSelectNode]
  );

  /* ── 항목 3: 빈 상태 — editablePlan이 없을 때 도트 그리드 위에 오버레이 ── */
  const isEmpty = editablePlan.length === 0;

  /* 로딩 신호: plan_thinking / mcp_plan_thinking 상태면 스켈레톤 3개 */
  const isLoading = workflowState === 'plan_thinking' || workflowState === 'mcp_plan_thinking';

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgeClick={handleEdgeClick}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={CANVAS_COLORS.dot} />
        {/* 항목 2: nodeColor 콜백으로 상태별 색 */}
        <MiniMap
          style={{ background: CANVAS_COLORS.miniMapBg, border: `1px solid ${CANVAS_COLORS.miniMapBorder}`, borderRadius: 4 }}
          nodeColor={miniMapNodeColor}
          maskColor="rgba(0,0,0,0.04)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* 항목 3: 로딩 오버레이 — 스켈레톤 노드 3개 */}
      {isEmpty && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-[200px]">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-[200px] rounded-lg border border-f-border bg-f-surface shadow-flat animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="pl-4 pr-2.5 pt-2.5 pb-2 border-b border-f-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="w-4 h-2 rounded bg-f-surface2 shrink-0" />
                    <div className="h-3 rounded bg-f-surface2 flex-1" />
                  </div>
                  <div className="w-10 h-[18px] rounded bg-f-surface2 shrink-0" />
                </div>
                <div className="pl-4 pr-2.5 py-2">
                  <div className="h-2.5 w-24 rounded bg-f-surface2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 항목 3: 빈 상태 오버레이 — 도트 그리드 위에 중앙 카드 */}
      {isEmpty && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-f-t4">
            <GitBranch size={40} strokeWidth={1.2} aria-hidden />
            <div className="text-center">
              <p className="text-[13px] font-medium text-f-t3 mb-0.5">분석 계획이 없습니다</p>
              <p className="text-[12px] text-f-t4">케이스를 선택하거나 새 분석을 시작하세요</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
