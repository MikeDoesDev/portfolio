export interface LabRow { label: string; value: number | null; margin: number; reference: number; text: string; note: string }

/**
 * Horizontal bars as a table, so the numbers are always readable as text.
 * Each row shows the measured value, its 95% interval as a band, and a
 * reference tick to compare against.
 */
export default function LabChart({ caption, rows, max, legend }: { caption: string; rows: LabRow[]; max: number; legend: string }) {
  const at = (value: number) => `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  return <figure className="lab-chart">
    <table>
      <caption>{caption}</caption>
      <tbody>{rows.map(row => <tr key={row.label}>
        <th scope="row">{row.label}</th>
        <td className="lab-track" aria-hidden="true">
          {row.value !== null && <>
            <span className="lab-band" style={{ left: at(row.value - row.margin), width: `calc(${at(row.value + row.margin)} - ${at(row.value - row.margin)})` }} />
            <span className="lab-bar" style={{ width: at(row.value) }} />
          </>}
          <span className="lab-ref" style={{ left: at(row.reference) }} />
        </td>
        <td className="lab-value">{row.value === null ? "Not run yet" : row.text}<small>{row.note}</small></td>
      </tr>)}</tbody>
    </table>
    <figcaption className="lab-legend"><span className="lab-key-bar" />simulated <span className="lab-key-band" />95% interval <span className="lab-key-ref" />{legend}</figcaption>
  </figure>;
}
