import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DeckCard({ deck, cardCount, onDelete }) {
  const navigate = useNavigate()

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-base">{deck.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <p className="text-sm text-stone-500">
          {cardCount === 1 ? '1 card' : `${cardCount} cards`}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t-0 pt-0">
        <Button
          type="button"
          size="sm"
          onClick={() => navigate(`/decks/${deck.id}`)}
        >
          Open
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onDelete(deck.id)}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
