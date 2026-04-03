export function amazonLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lifekeep-20`;
}

export function googleShoppingLink(query) {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
}

// Estimate product price and commission from search query keywords
function estimateCommission(query) {
  const q = (query || "").toLowerCase();

  // Price estimates by product type
  const priceRules = [
    { match: /tire|tires/, price: 150, rate: 4.5 },
    { match: /battery.*group|agm battery/, price: 160, rate: 4.5 },
    { match: /brake pad/, price: 45, rate: 4.5 },
    { match: /spark plug/, price: 12, rate: 4.5 },
    { match: /oil filter|fuel filter/, price: 10, rate: 4.5 },
    { match: /synthetic oil|motor oil|engine oil|5w-30|0w-20|10w-30/, price: 28, rate: 4.5 },
    { match: /transmission fluid|cvt fluid|atf/, price: 22, rate: 4.5 },
    { match: /coolant|antifreeze/, price: 18, rate: 4.5 },
    { match: /wiper blade/, price: 24, rate: 4.5 },
    { match: /serpentine belt|drive belt/, price: 25, rate: 4.5 },
    { match: /differential fluid|transfer case/, price: 15, rate: 4.5 },
    { match: /cabin air filter|cabin filter/, price: 15, rate: 3 },
    { match: /engine air filter|air filter.*engine/, price: 16, rate: 3 },
    { match: /merv.*13|merv 13/, price: 28, rate: 3 },
    { match: /merv.*11|merv 11/, price: 22, rate: 3 },
    { match: /air filter.*pack|pack.*air filter/, price: 45, rate: 3 },
    { match: /air filter|furnace filter|hvac filter|\d+x\d+x\d+/, price: 18, rate: 3 },
    { match: /water filter|refrigerator filter|fridge filter/, price: 35, rate: 3 },
    { match: /pool filter|filter cartridge.*pool/, price: 25, rate: 3 },
    { match: /mower blade|mulching blade/, price: 20, rate: 3 },
    { match: /chainsaw chain|chain.*\d+inch/, price: 18, rate: 3 },
    { match: /trimmer line|string trimmer/, price: 12, rate: 3 },
    { match: /anode rod/, price: 25, rate: 3 },
    { match: /water heater element/, price: 20, rate: 3 },
    { match: /faucet cartridge|valve cartridge/, price: 22, rate: 3 },
    { match: /flapper|fill valve|toilet/, price: 10, rate: 3 },
    { match: /bike tire|bicycle tire|700x|26x/, price: 35, rate: 3 },
    { match: /bike chain|bicycle chain/, price: 25, rate: 3 },
    { match: /brake.*disc.*pad|disc brake pad.*bike/, price: 18, rate: 3 },
    { match: /vacuum filter|roomba|robot vacuum/, price: 20, rate: 3 },
    { match: /hepa filter|hepa/, price: 30, rate: 3 },
    { match: /dehumidifier filter|humidifier filter/, price: 15, rate: 3 },
    { match: /dryer vent|lint/, price: 12, rate: 3 },
    { match: /smoke detector|carbon monoxide|co detector/, price: 30, rate: 3 },
    { match: /weatherstrip|door seal|foam seal/, price: 10, rate: 3 },
    { match: /caulk|sealant|silicone/, price: 8, rate: 3 },
    { match: /stain|deck stain|wood stain/, price: 35, rate: 3 },
    { match: /lubricant|wd-40|grease|lube/, price: 8, rate: 3 },
    { match: /cleaner|cleaning|descaler/, price: 12, rate: 3 },
  ];

  for (const rule of priceRules) {
    if (rule.match.test(q)) {
      const commission = (rule.price * rule.rate / 100);
      return {
        estPrice: rule.price,
        rate: rule.rate,
        commission: commission,
      };
    }
  }

  // Default fallback
  return { estPrice: 20, rate: 3, commission: 0.60 };
}

export default function ProductLinks({ query, name }) {
  const est = estimateCommission(query);

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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: "#C4A265" }}>Amazon</span>
              <span style={{ fontSize: 10, color: "#2D5A3D", background: "#E8F0EA", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                ~${est.commission.toFixed(2)} commission ({est.rate}%)
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#C4A265" }}>~${est.estPrice}</div>
          <div style={{ fontSize: 10, color: "#9A9A9A" }}>est. price</div>
        </div>
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
            <div style={{ fontSize: 11, color: "#5A7ABF", marginTop: 2 }}>Google Shopping · compare prices</div>
          </div>
        </div>
        <span style={{ fontSize: 13, color: "#5A7ABF", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>Compare →</span>
      </a>
    </div>
  );
}
