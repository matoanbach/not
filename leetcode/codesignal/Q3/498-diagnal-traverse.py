class Solution:
    def findDiagonalOrder(self, mat: List[List[int]]) -> List[int]:
        """
            moveTopRight:       row--, col++
            moveBottomLeft:     row++, col--

            bottomleft -> topright: r - 1 , c + 1
            topright -> bottomleft: r + 1, c - 1
                while going up:
                    if see out of bound:
                        increment row by 1
                        decrement col by 1
                    increment row by 1
                
                while going down:
                    if see out of bound:
                        decrement row by 1
                        increment col by 1
                    increment col by 1
                
            if going topright -> bottomleft and out of bound:
                move to the next cel: r + 1
        """
        ROWS, COLS = len(mat), len(mat[0])
        go_up = True
        row = col = 0
        output = []
        while len(output) != ROWS * COLS:
            if go_up:
                while row in range(ROWS) and col in range(COLS):
                    output.append(mat[row][col])
                    row -= 1
                    col += 1
                
                row += 1
                if col not in range(COLS):
                    row += 1
                    col -= 1

            else:
                while row in range(ROWS) and col in range(COLS):
                    output.append(mat[row][col])
                    row += 1
                    col -= 1
                col += 1
                if row not in range(ROWS):
                    row -= 1
                    col += 1
            go_up = not go_up
                
        return output