'use client';

import { useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node to make it look like Obsidian graph
const CustomNode = ({ data }: any) => {
  const isCenter = data.isCenter;
  return (
    <div className={`px-4 py-2 shadow-md rounded-full border-2 ${isCenter ? 'bg-indigo-500 border-indigo-700 text-white font-bold' : 'bg-gray-800 border-gray-600 text-gray-200'}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div>{data.label}</div>
      <div className="text-xs opacity-70">{data.role}</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function OrgGraphView({ user, allUsers = [] }: { user: any, allUsers?: any[] }) {
  // Build tree data recursively or simply just show immediate upline and all downlines
  
  const initialNodes: any[] = [];
  const initialEdges: any[] = [];

  // Center Node
  initialNodes.push({
    id: user.id,
    type: 'custom',
    data: { label: user.name, role: user.role, isCenter: true },
    position: { x: 400, y: 300 },
  });

  // Upline Node
  if (user.upline) {
    initialNodes.push({
      id: 'upline',
      type: 'custom',
      data: { label: user.upline.name, role: user.upline.role, isCenter: false },
      position: { x: 400, y: 150 },
    });
    initialEdges.push({ id: 'e-up', source: 'upline', target: user.id, animated: true, style: { stroke: '#6366f1' } });
  }

  // Downlines
  if (user.downlines && user.downlines.length > 0) {
    const spacing = 150;
    const startX = 400 - ((user.downlines.length - 1) * spacing) / 2;
    
    user.downlines.forEach((dl: any, index: number) => {
      initialNodes.push({
        id: dl.id,
        type: 'custom',
        data: { label: dl.name, role: dl.role, isCenter: false },
        position: { x: startX + (index * spacing), y: 450 },
      });
      initialEdges.push({ id: `e-${dl.id}`, source: user.id, target: dl.id, animated: true });
    });
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100%', height: '500px' }} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        className="dark"
      >
        <MiniMap 
          nodeStrokeColor={(n) => {
            if (n.data?.isCenter) return '#4f46e5';
            return '#1f2937';
          }}
          nodeColor={(n) => {
            if (n.data?.isCenter) return '#6366f1';
            return '#374151';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
        />
        <Controls className="bg-gray-800 fill-white text-white border-gray-700" />
        <Background color="#4b5563" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
