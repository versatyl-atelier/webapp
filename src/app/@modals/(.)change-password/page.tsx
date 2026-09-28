import { Modal } from "@/components/Modal";
import ChangePasswordPage, {
  type ChangePasswordPageProps,
} from "@/app/change-password/page";
import { CHANGE_PASSWORD_PATH } from "@/constants/auth";

export default async function ModalChangePassword(
  props: ChangePasswordPageProps,
) {
  return (
    <Modal path={CHANGE_PASSWORD_PATH}>
      <ChangePasswordPage {...props} />
    </Modal>
  );
}
