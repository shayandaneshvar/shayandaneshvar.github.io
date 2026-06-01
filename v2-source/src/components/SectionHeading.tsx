interface Props {
  number?: string
  title: string
}

export default function SectionHeading({ title }: Props) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <h2 style={{ color: 'var(--text-bright)' }} className="text-2xl md:text-3xl font-bold whitespace-nowrap">
        {title}
      </h2>
      <div style={{ backgroundColor: 'var(--border)' }} className="flex-1 h-px" />
    </div>
  )
}
