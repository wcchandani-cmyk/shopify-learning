import { useParams } from "react-router-dom";
import DiscountDetail from "../components/discounts/DiscountDetail";
import { slugToDiscountType } from "../constants/discounts";

export default function DiscountCreatePage() {
  const { type } = useParams();
  const normalizedType = slugToDiscountType(type);

  return <DiscountDetail isNew type={normalizedType} />;
}
