export default function JsonLd({ data }) {
  if (!data) return null;

  const payload = Array.isArray(data) ? data.filter(Boolean) : data;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, '\\u003c') }}
    />
  );
}
