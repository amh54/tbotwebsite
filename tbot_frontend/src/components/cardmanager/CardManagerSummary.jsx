const RARITY_COLUMNS = [
  "Common",
  "Uncommon",
  "Rare",
  "Super-Rare",
  "Legendary",
];
const SET_ORDER = ["Basic", "Premium", "Galactic", "Colossal", "Triassic"];

const rarityKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replaceAll(/[^a-z]/g, "");

const COLUMN_KEYS = RARITY_COLUMNS.map(rarityKey);

const formatPercent = (value) =>
  Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;

const getCellStatus = (owned, total, complete) => {
  if (total > 0 && complete === total) return "complete";
  if (total > 0 && owned === total) return "owned";
  if (owned > 0) return "partial";
  return "none";
};

const buildGrid = (breakdown) => {
  const sets = new Map();

  breakdown.forEach((group) => {
    if (!sets.has(group.setName)) {
      sets.set(group.setName, { setName: group.setName, groups: [] });
    }
    sets.get(group.setName).groups.push(group);
  });

  const rows = [...sets.values()].map((row) => {
    const columns = COLUMN_KEYS.map((key) =>
      row.groups.find((group) => rarityKey(group.rarityName) === key),
    );

    // A set with no standard rarities (e.g. Event) gets one full-width cell.
    const spansAll = columns.every((cell) => !cell);

    const totals = row.groups.reduce(
      (sum, group) => ({
        total: sum.total + group.total,
        owned: sum.owned + group.owned,
        complete: sum.complete + group.complete,
      }),
      { total: 0, owned: 0, complete: 0 },
    );

    return { ...row, columns, spansAll, totals };
  });

  const orderIndex = (name) => {
    const index = SET_ORDER.indexOf(name);
    return index === -1 ? SET_ORDER.length : index;
  };

  return rows.sort((a, b) => orderIndex(a.setName) - orderIndex(b.setName));
};

const GridCell = ({ owned, total, complete, colSpan }) => (
  <td
    colSpan={colSpan}
    className={`completion-cell ${getCellStatus(owned, total, complete)}`}
    title={`${complete}/${total} full playsets`}
  >
    {owned}/{total}
  </td>
);

const CardManagerSummary = ({ ownedCount, totalQuantity, completion }) => {
  const gridRows = buildGrid(completion.breakdown);
  const isFullCollection =
    completion.total > 0 && completion.missingCards === 0;

  const groupsNeedingWork = completion.breakdown.filter(
    (group) =>
      group.missingCards.length > 0 || group.incompleteCards.length > 0,
  );

  return (
    <>
      <section className="card-manager-summary">
        <div className="summary-item">
          <span className="summary-label">Unique Cards</span>
          <strong>{ownedCount}</strong>
        </div>

        <div className="summary-item">
          <span className="summary-label">Total Copies</span>
          <strong>{totalQuantity}</strong>
        </div>

        <div className="summary-item">
          <span className="summary-label">Completion</span>
          <strong>
            {completion.ownedUnique} / {completion.total} (
            {formatPercent(completion.collectionPercent)})
          </strong>
          <span className="summary-detail">
            4x playsets: {completion.completePlaysets} / {completion.total} (
            {formatPercent(completion.playsetPercent)})
          </span>
        </div>
      </section>

      <details className="completion-panel" open>
        <summary className="completion-panel-title">
          Completion breakdown ({formatPercent(completion.collectionPercent)}
          {isFullCollection ? " — full collection of normal cards!" : ""})
        </summary>

        <h3 className="completion-panel-subtitle">By set / rarity</h3>

        {gridRows.length === 0 ? (
          <p className="completion-empty">
            Card catalog statistics are unavailable.
          </p>
        ) : (
          <div className="completion-grid-scroll">
            <table className="completion-grid">
              <thead>
                <tr>
                  <th aria-label="Set" />
                  {RARITY_COLUMNS.map((rarity) => (
                    <th key={rarity}>{rarity}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row) => (
                  <tr key={row.setName}>
                    <th scope="row">{row.setName}</th>

                    {row.spansAll ? (
                      <GridCell
                        colSpan={RARITY_COLUMNS.length}
                        owned={row.totals.owned}
                        total={row.totals.total}
                        complete={row.totals.complete}
                      />
                    ) : (
                      row.columns.map((cell, index) =>
                        cell ? (
                          <GridCell
                            key={RARITY_COLUMNS[index]}
                            owned={cell.owned}
                            total={cell.total}
                            complete={cell.complete}
                          />
                        ) : (
                          <td
                            key={RARITY_COLUMNS[index]}
                            className="completion-cell empty"
                          >
                            —
                          </td>
                        ),
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {groupsNeedingWork.length > 0 && (
          <details className="completion-missing">
            <summary>
              Missing &amp; incomplete cards ({completion.missingCards} missing,{" "}
              {completion.missingCopies} copies needed)
            </summary>
            {groupsNeedingWork.map((group) => (
              <details
                className="completion-breakdown-group"
                key={`${group.setName}-${group.rarityName}`}
                open
              >
                <summary>
                  <span>
                    {group.setName === group.rarityName
                      ? group.setName
                      : `${group.setName} - ${group.rarityName}`}
                  </span>
                  <span>
                    {group.owned}/{group.total} 
                  </span>
                </summary>
                {group.missingCards.length > 0 && (
                  <div>
                    <h4>Missing Cards</h4>
                    <ul>
                      {group.missingCards.map((card) => (
                        <li
                          key={card.cardName}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "16px",
                          }}
                        >
                          <span>{card.cardName}</span>
                          <span>{card.owned}/4</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </details>
            ))}
          </details>
        )}
      </details>
    </>
  );
};

export default CardManagerSummary;
