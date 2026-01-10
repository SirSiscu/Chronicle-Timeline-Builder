
export const parseFlexibleDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  // If it's just a year
  if (/^-?\d{1,4}$/.test(dateStr)) {
    return parseInt(dateStr, 10);
  }
  // Try parsing full date and return year as float for more precision
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.getFullYear() + (date.getMonth() / 12) + (date.getDate() / 365);
  }
  return 0;
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  if (/^-?\d{1,4}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
};

export const getYouTubeEmbedUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};
