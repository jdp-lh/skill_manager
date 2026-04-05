type PlaceholderViewProps = {
  title: string;
  description: string;
};

export function PlaceholderView({ title, description }: PlaceholderViewProps) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center">
      <div className="max-w-md rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
      </div>
    </div>
  );
}
