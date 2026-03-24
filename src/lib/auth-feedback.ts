export type AuthAction = 'login' | 'signup';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string) {
  return EMAIL_REGEX.test(email.trim());
}

export function mapAuthFailureMessage(action: AuthAction, status: number, rawMessage?: string | null) {
  const message = (rawMessage ?? '').trim().toLowerCase();

  if (action === 'login') {
    if (
      status === 401 ||
      status === 403 ||
      status === 404 ||
      message.includes('invalid') ||
      message.includes('credential') ||
      message.includes('password') ||
      message.includes('unauthorized') ||
      message.includes('not found')
    ) {
      return '이메일 또는 비밀번호를 다시 확인해 주세요.';
    }
    return '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }

  if (
    status === 409 ||
    message.includes('already exists') ||
    message.includes('already registered') ||
    message.includes('duplicate') ||
    message.includes('conflict') ||
    message.includes('taken')
  ) {
    return '이미 사용 중인 이메일입니다. 다른 이메일을 사용해 주세요.';
  }

  if (message.includes('password') && (message.includes('short') || message.includes('weak'))) {
    return '비밀번호는 더 안전한 값으로 다시 설정해 주세요.';
  }

  if (message.includes('email') && (message.includes('invalid') || message.includes('format'))) {
    return '이메일 형식을 다시 확인해 주세요.';
  }

  return '회원가입에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.';
}
