import React from 'react';

type SchemaType = 'SoftwareApplication' | 'WebApplication' | 'Recipe' | 'Article';

interface JsonLdProps {
    type: SchemaType;
    data: Record<string, any>;
}

export default function JsonLd({ type, data }: JsonLdProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': type,
        ...data,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
