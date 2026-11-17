export function Button({ children, variant = 'primary', ...props }) {
  return <button className={`button button--${variant}`} {...props}>{children}</button>
}

export function Card({ children, className = '', ...props }) {
  return <section className={`card ${className}`} {...props}>{children}</section>
}

export function StatusBadge({ status }) {
  const statusClass = status.toLowerCase().replaceAll(' ', '-')
  return <span className={`status-badge status-badge--${statusClass}`}>{status}</span>
}

export function ProgressBar({ value }) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div className="progress-track" role="img" aria-label={`${value}% complete`}>
      <span className="progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  )
}

export function DataTable({ columns, rows, rowKey, emptyMessage = 'Nothing to show yet.' }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          )) : (
            <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
