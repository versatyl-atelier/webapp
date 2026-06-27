import { Modal } from "@/components/Modal";
import LoginPage, { type LoginPageProps } from "@/app/login/page";
export default async function ModalPage(props: LoginPageProps) {
  return (
    <Modal>
      <LoginPage {...props} />
    </Modal>
  );
}
