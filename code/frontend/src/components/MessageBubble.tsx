interface Props {
  sender: string;
  text: string;
}

export default function MessageBubble({ sender, text }: Props) {
  const isUser = sender === "user";
  return (
    <div
      className={`p-3 rounded-lg max-w-[80%] my-1 ${
        isUser
          ? "bg-blue-600 text-white self-end ml-auto"
          : "bg-gray-200 text-black self-start mr-auto"
      }`}
    >
      {text}
    </div>
  );
}