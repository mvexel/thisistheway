// components/OSMInput.tsx
'use client';

import { useState } from 'react';

interface OSMInputProps {
    onSubmit: (elementType: string, elementId: string) => void;
}

export default function OSMInput({ onSubmit }: OSMInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Parse the input to extract element type and ID
        const parsed = parseOSMInput(input);
        if (parsed) {
            onSubmit(parsed.type, parsed.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter OSM ID (e.g., node/1, n1, or https://www.openstreetmap.org/node/1)"
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Load History
                </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
                Examples: node/1, n1, way/1234, w1234, relation/5678, r5678, or full OSM URL
            </div>
        </form>
    );
}

function parseOSMInput(input: string): { type: string; id: string } | null {
    // Handle full URLs
    if (input.includes('openstreetmap.org')) {
        const urlMatch = input.match(/\/(?:node|way|relation)\/(\d+)/);
        if (urlMatch) {
            const type = urlMatch[0].split('/')[1];
            return { type, id: urlMatch[1] };
        }
    }

    // Handle node/123, way/123, relation/123 format
    const slashMatch = input.match(/^(node|way|relation)\/(\d+)$/i);
    if (slashMatch) {
        return { type: slashMatch[1].toLowerCase(), id: slashMatch[2] };
    }

    // Handle n123, w123, r123 format
    const shortMatch = input.match(/^([nwr])(\d+)$/i);
    if (shortMatch) {
        const typeMap: Record<string, string> = { n: 'node', w: 'way', r: 'relation' };
        const type = typeMap[shortMatch[1].toLowerCase()];
        return { type, id: shortMatch[2] };
    }

    return null;
}
