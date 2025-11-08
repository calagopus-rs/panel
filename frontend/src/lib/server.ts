export function formatAllocation(allocation?: ServerAllocation | NodeAllocation | null, separatePort: boolean = false) {
  return allocation
    ? separatePort
      ? allocation.ipAlias || allocation.ip
      : `${allocation.ipAlias || allocation.ip}:${allocation.port}`
    : 'None';
}

export function generateBackupName() {
  // Get current date
  const now = new Date();

  // Format the date to match Rust's chrono::Local::now().format("%Y-%m-%dT%H%M%S%z")
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Get timezone offset in minutes
  const tzOffset = now.getTimezoneOffset();
  const tzSign = tzOffset <= 0 ? '+' : '-';
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
  const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
  const tzFormatted = `${tzSign}${tzHours}${tzMinutes}`;

  // Create the formatted date string
  const formattedDate = `${year}-${month}-${day}T${hours}${minutes}${seconds}${tzFormatted}`;

  // Return the filename
  return `backup-${formattedDate}`;
}
