from collections import deque


class Solution:
    def isToeplitzMatrix(self, matrix: List[List[int]]) -> bool:
        ROWS, COLS = len(matrix), len(matrix[0])
        group = {}
        for r in range(ROWS):
            for c in range(COLS):
                if c - r in group:
                    if matrix[r][c] != group[c-r]: return False
                else:
                    group[c-r] = matrix[r][c]

        return True