import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const [accountType, setAccountType] = useState<'merchant' | 'user'>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', { accountType, email, password })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold text-center mb-8">Welcome to nTangleMint, where loyalty meets innovation.</h1>
      <div className="w-full max-w-md">
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Account</TabsTrigger>
            <TabsTrigger value="login">Log In</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <RadioGroup value={accountType} onValueChange={(value: 'merchant' | 'user') => setAccountType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user">User Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merchant" id="merchant" />
                  <Label htmlFor="merchant">Merchant Account</Label>
                </div>
              </RadioGroup>
              <Button type="submit" className="w-full bg-black text-white hover:bg-black/90">
                Create Account
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="login">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginEmail">Email</Label>
                <Input
                  id="loginEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginPassword">Password</Label>
                <Input
                  id="loginPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <RadioGroup value={accountType} onValueChange={(value: 'merchant' | 'user') => setAccountType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="loginUser" />
                  <Label htmlFor="loginUser">User Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merchant" id="loginMerchant" />
                  <Label htmlFor="loginMerchant">Merchant Account</Label>
                </div>
              </RadioGroup>
              <Button type="submit" className="w-full bg-black text-white hover:bg-black/90">
                Log In
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}