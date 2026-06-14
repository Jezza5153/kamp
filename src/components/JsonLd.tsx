/**
 * Renders one or more schema.org nodes as a JSON-LD <script>. Pass a single
 * object (typically a @graph document from lib/schema) or an array of nodes.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
