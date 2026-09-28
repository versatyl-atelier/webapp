import { Modal } from "@/components/Modal";
import LoginPage, { type LoginPageProps } from "@/app/login/page";
export default async function ModalLogin(props: LoginPageProps) {
  return (
    <Modal path="/login">
      <LoginPage {...props} />
    </Modal>
  );
}
