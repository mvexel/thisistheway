// components/TimelineDebug.tsx
import { OSMElement } from '@/types';
import React from 'react';



interface TimelineDebugProps {
    versions: OSMElement[];
    clusters: Array<{ index: number, size: number }>;
}

export default function TimelineDebug({ versions, clusters }: TimelineDebugProps) {
    return (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
            <h3 className="font-medium mb-2">Timeline Debug</h3>

            <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="font-semibold">Version</div>
                <div className="font-semibold">Timestamp</div>
                <div className="font-semibold">User</div>
                <div className="font-semibold">In Cluster</div>

                {versions.map((version, idx) => {
                    // Find which cluster this version belongs to
                    const clusterInfo = clusters.find(c => {
                        const clusterVersion = versions[c.index];
                        const clusterTime = new Date(clusterVersion.timestamp).getTime();
                        const versionTime = new Date(version.timestamp).getTime();
                        const timeThreshold = 3600000; // 1 hour
                        return Math.abs(clusterTime - versionTime) < timeThreshold;
                    });

                    return (
                        <React.Fragment key={`${version.type}-${version.id}-v${version.version}`}>
                            <div>{version.version}</div>
                            <div>{new Date(version.timestamp).toLocaleString()}</div>
                            <div>{version.user}</div>
                            <div>{clusterInfo ? `Cluster size: ${clusterInfo.size}` : 'No'}</div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
