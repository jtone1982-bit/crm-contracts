export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Ожидание подтверждения</h1>
        <p className="text-gray-600 mb-6">
          Ваша регистрация отправлена администратору. После одобрения вы сможете войти в систему.
        </p>
        <a href="/login" className="text-blue-600 hover:underline">Вернуться к входу</a>
      </div>
    </div>
  )
}
