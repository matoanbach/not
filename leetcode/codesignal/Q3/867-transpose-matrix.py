class Solution:
    def transpose(self, matrix: List[List[int]]) -> List[List[int]]:
        """
        [1,2,3]
        [4,5,6]

        [1,4]
        [2,5]
        [3,6]]
        """
        ROWS, COLS = len(matrix), len(matrix[0])
        output = []
        for c in range(COLS):
            layer = []
            for r in range(ROWS):
                layer.append(matrix[r][c])
            
            output.append(layer)
        return output