interface DetailLinkProps {
  title: string;
  onClick?: (v: string) => void;
}


const DetailLink = ({ title, onClick }: DetailLinkProps) => {
  return (
    <span className="font-medium underline text-sky-700 hover:text-sky-800 cursor-pointer" onClick={(v) => onClick?.(v)}>
      {title}
    </span>
  );
};

export default DetailLink;
