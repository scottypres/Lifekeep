export function amazonLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lifekeep-20`;
}

export function googleShoppingLink(query) {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
}

export default function ProductLinks({ query, name }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <a
        href={amazonLink(query)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", background: "#FFF9EE",
          border: "1px solid #F0E6CC", borderRadius: 10,
          textDecoration: "none", color: "#1A1A1A",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🛒</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || query}</div>
            <div style={{ fontSize: 11, color: "#C4A265", marginTop: 2 }}>Amazon</div>
          </div>
        </div>
        <span style={{ fontSize: 13, color: "#C4A265", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>Shop →</span>
      </a>
      <a
        href={googleShoppingLink(query)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", background: "#F0F4FF",
          border: "1px solid #D0DBEF", borderRadius: 10,
          textDecoration: "none", color: "#1A1A1A",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || query}</div>
            <div style={{ fontSize: 11, color: "#5A7ABF", marginTop: 2 }}>Google Shopping</div>
          </div>
        </div>
        <span style={{ fontSize: 13, color: "#5A7ABF", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>Compare →</span>
      </a>
    </div>
  );
}
