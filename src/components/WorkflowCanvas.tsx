'use client';

import { useCallback, useEffect, useMemo } from 'react';
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
  type NodeMouseHandler,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import WorkflowNode, { type WorkflowNodeType } from './nodes/WorkflowNode';
import type { PlanStep, StepRun, WorkflowNodeData } from '@/types';
import { GitBranch } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const nodeTypes: NodeTypes = { workflowNode: WorkflowNode };

// React Flow는 색상 props로 raw 문자열을 요구하므로, 테마에 따라 토큰 값을 동기화한다.
const LIGHT_CANVAS_COLORS = {
  dot: '#e4e4e7',
  miniMapBg: '#ffffff',
  miniMapBorder: '#e4e4e7',
  edgeIdle: '#d4d4d8',
  edgeActive: '#2563eb',
  nodeRunning:  '#2563eb',
  nodeDone:     '#d4d4d8',
  nodeApproved: '#16a34a',
  nodeIdle:     '#e4e4e7',
  miniMapMask:  'rgba(17,24,39,0.04)',
} as const;

const DARK_CANVAS_COLORS = {
  dot: '#2a2a30',
  miniMapBg: '#141418',
  miniMapBorder: '#2a2a30',
  edgeIdle: '#3a3a42',
  edgeActive: '#60a5fa',
  nodeRunning:  '#60a5fa',
  nodeDone:     '#3a3a42',
  nodeApproved: '#4ade80',
  nodeIdle:     '#2a2a30',
  miniMapMask:  'rgba(0,0,0,0.32)',
} as const;

interface Props {
  editablePlan: PlanStep[];
  workflowState: string;
  activeStep: number;
  selectedNode: number | null;
  onSelectNode: (idx: number) => void;
  dfxmlFragments?: Record<number, string>;
  stepRuns?: Record<number, StepRun>;
  caseTitle?: string;
}

export default function WorkflowCanvas({
  editablePlan, workflowState, activeStep, selectedNode, onSelectNode, dfxmlFragments, stepRuns, caseTitle,
}: Props) {
  const { theme } = useTheme();
  const CANVAS_COLORS = theme === 'dark' ? DARK_CANVAS_COLORS : LIGHT_CANVAS_COLORS;

  const miniMapNodeColor = useCallback(
    (node: Node): string => {
      const status = (node.data as WorkflowNodeData | undefined)?.nodeStatus;
      switch (status) {
        case 'running':  return CANVAS_COLORS.nodeRunning;
        case 'done':     return CANVAS_COLORS.nodeDone;
        case 'approved': return CANVAS_COLORS.nodeApproved;
        default:         return CANVAS_COLORS.nodeIdle;
      }
    },
    [CANVAS_COLORS]
  );

  const miniMapStyle = useMemo(
    () => ({
      background: CANVAS_COLORS.miniMapBg,
      border: `1px solid ${CANVAS_COLORS.miniMapBorder}`,
      borderRadius: 6,
      boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
    }),
    [CANVAS_COLORS]
  );

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
      purpose: item.purpose,
      hints: item.hints,
      run: stepRuns?.[i],
    }),
    [getNodeStatus, selectedNode, onSelectNode, dfxmlFragments, stepRuns, caseTitle]
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
          position: { x: 40 + i * 380, y: 80 },
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

  // 엣지 갱신 — 기본 smoothstep, 진행 중이면 강조
  useEffect(() => {
    setEdges(
      editablePlan.slice(0, -1).map((_step, i) => {
        const isActive = workflowState === 'running' && i <= activeStep;
        return {
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
          type: 'smoothstep' as const,
          animated: isActive,
          style: { stroke: isActive ? CANVAS_COLORS.edgeActive : CANVAS_COLORS.edgeIdle, strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: isActive ? CANVAS_COLORS.edgeActive : CANVAS_COLORS.edgeIdle,
          },
        };
      })
    );
  }, [editablePlan, workflowState, activeStep, setEdges, CANVAS_COLORS]);

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
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 0.95, minZoom: 0.4 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color={CANVAS_COLORS.dot} />
        {/* MiniMap — 테마 인지 카드 */}
        <MiniMap
          style={miniMapStyle}
          nodeColor={miniMapNodeColor}
          nodeStrokeWidth={0}
          nodeBorderRadius={3}
          maskColor={CANVAS_COLORS.miniMapMask}
          pannable
          zoomable
        />
        <Controls showInteractive={false} className="!shadow-flat !rounded-[6px] !border !border-f-border !bg-f-surface [&>button]:!bg-transparent [&>button]:!border-0 [&>button]:!text-f-t3 hover:[&>button]:!text-f-t1" />
      </ReactFlow>

      {/* 로딩 오버레이 — 스켈레톤 노드 3개 */}
      {isEmpty && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-[124px]">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="relative w-[256px] rounded-[10px] border border-f-border bg-f-surface shadow-flat animate-pulse overflow-hidden"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="absolute left-0 top-2 bottom-2 w-[3.5px] rounded-r-[3px] bg-f-border" aria-hidden />
                <div className="pl-3.5 pr-2.5 pt-2.5 pb-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="h-2.5 flex-1 rounded bg-f-surface2" />
                    <div className="w-14 h-[20px] rounded-full bg-f-surface2 shrink-0" />
                  </div>
                  <div className="h-2 w-32 rounded bg-f-surface2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 빈 상태 오버레이 — 도트 그리드 위에 중앙 카드 */}
      {isEmpty && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-[10px] bg-f-surface border border-f-border shadow-flat flex items-center justify-center">
              <GitBranch size={20} strokeWidth={1.4} className="text-f-t3" aria-hidden />
            </div>
            <div className="text-center max-w-[260px]">
              <p className="text-[13px] font-semibold text-f-t2 mb-1 tracking-[-0.005em]">분석 계획이 없습니다</p>
              <p className="text-[11.5px] text-f-t4 leading-snug">케이스를 선택하거나 우측 패널에서 새 분석을 시작하세요</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
