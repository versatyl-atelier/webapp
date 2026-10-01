import { Modal } from "@/components/Modal";
import SearchPage from "@/app/recherche/page";
import { SEARCH_PATH } from "@/constants/tools";

export default function ModalSearch() {
  return (
    <Modal path={SEARCH_PATH}>
      <SearchPage />
    </Modal>
  );
}
