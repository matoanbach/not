class Solution:
    def largestLocal(self, grid: List[List[int]]) -> List[List[int]]:
        ROWS, COLS = len(grid), len(grid[0])

        output=[[0] * (COLS - 2) for _ in range(COLS - 2)]
        for row in range(ROWS - 2):
            for col in range(COLS - 2):
                highest = float("-inf")
                for r in range(3):
                    for c in range(3):
                        highest = max(highest, grid[row + r][col + c])
                output[row][col] = highest
        return output

        